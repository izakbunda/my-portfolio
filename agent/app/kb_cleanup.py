"""'Fix with AI': turn a dashboard braindump into clean, KB-ready Q&A drafts.

Drafts are only suggestions; nothing is saved until Izak approves one in the
dashboard."""
import re

from pydantic import BaseModel, Field

from app.llm import deepseek
from app.retriever import _supabase, search

CLEANUP_PROMPT = """You turn Izak Bunda's rough notes into clean entries for the \
knowledge base behind his portfolio chatbot.

Write each entry as a question a portfolio visitor might ask, plus the answer.

Rules:
- Third person, about Izak ("Izak built...", "He prefers...").
- Specific beats vague: "Izak built X for Y using Z" beats "Izak has experience in Z".
- Use ONLY facts from the notes (and the existing entry, when merging). Never invent \
details, numbers, dates or opinions. Fix grammar and structure, keep his voice and meaning.
- Concise: a few short paragraphs at most. Plain markdown, no headings.
- If the notes cover several distinct topics, split them into separate entries. \
If they cover one topic, return exactly one entry.
- If the notes include a draft question, use it (cleaned up) for that entry.
- category: reuse one of the existing categories when it fits; otherwise suggest a short new one.

Overlaps: below are existing entries that may cover the same topic. If an entry's topic is \
already covered by one of them, set merge_into to that entry's id, keep (or lightly improve) \
the existing question, and write `answer` with just the new facts from the notes (they get \
merged into the existing answer afterwards). Explain the overlap in one short sentence in \
merge_reason. Only merge when the topic genuinely matches."""


MERGE_PROMPT = """You update one entry in Izak Bunda's portfolio-chatbot knowledge base.

Rewrite the existing answer so it also includes the new facts. Keep EVERY fact, detail \
and the voice of the existing answer; only add or adjust what the new facts change (new \
facts win where they conflict). Third person, plain markdown, no headings, no preamble. \
Return only the updated answer text."""

_merger = deepseek(temperature=0.2)


def merge_answer(existing: str, new_facts: str) -> str:
    merged = _merger.invoke([
        ("system", MERGE_PROMPT),
        ("user", f"Existing answer:\n<existing>\n{existing}\n</existing>\n\n"
                 f"New facts:\n<new>\n{new_facts}\n</new>"),
    ]).content.strip()
    # Never let a merge silently drop content: a rewrite that comes back much
    # shorter than the original means facts were lost, so append instead.
    if len(merged) < 0.9 * len(existing):
        return f"{existing.rstrip()}\n\n{new_facts.strip()}"
    return merged


class Draft(BaseModel):
    question: str = Field(description="Visitor-style question, e.g. 'What is Izak's take on AI evals?'")
    answer: str = Field(description="Clean third-person answer in markdown")
    category: str | None = Field(default=None, description="Existing category name, or a short new one")
    merge_into: str | None = Field(default=None, description="id of the existing entry this updates, if any")
    merge_reason: str | None = Field(default=None, description="One sentence on why it overlaps")


class Drafts(BaseModel):
    drafts: list[Draft] = Field(description="1 or more entries")


_structured = deepseek(temperature=0.2).with_structured_output(Drafts, method="function_calling")


def _segments(text: str, max_segments: int = 8) -> list[str]:
    """Sentences/lines worth searching on their own. A multi-topic braindump
    searched as one blob only surfaces entries for its dominant topic."""
    parts = [p.strip() for p in re.split(r"(?<=[.!?])\s+|\n+", text)]
    return [p for p in parts if len(p) >= 20][:max_segments]


def _overlap_candidates(text: str, limit: int = 8) -> list[dict]:
    ids: list[str] = []
    for query in [text, *_segments(text)]:
        for row in search(query, match_count=6)[:3]:
            if row.get("entry_id") and row["entry_id"] not in ids:
                ids.append(row["entry_id"])
    if not ids:
        return []
    rows = (
        _supabase.table("kb_entries").select("id, kind, title, body, category")
        .in_("id", ids[:limit]).execute().data
    )
    order = {entry_id: i for i, entry_id in enumerate(ids)}
    return sorted((r for r in rows if r["kind"] == "qa"), key=lambda r: order[r["id"]])


def _categories() -> list[str]:
    rows = _supabase.table("kb_entries").select("category").eq("kind", "qa").execute().data
    return sorted({r["category"] for r in rows if r["category"]})


def cleanup(text: str, question: str | None = None) -> list[dict]:
    candidates = _overlap_candidates(f"{question or ''}\n{text}".strip())
    existing = "\n\n".join(
        f"[id: {c['id']}] ({c.get('category') or 'uncategorized'})\nQ: {c['title']}\nA: {c['body']}"
        for c in candidates
    ) or "(none)"
    notes = f"Draft question: {question}\n\n{text}" if question else text

    result: Drafts = _structured.invoke([
        ("system", CLEANUP_PROMPT),
        ("user",
         f"Existing categories: {', '.join(_categories()) or '(none)'}\n\n"
         f"Existing entries that may overlap:\n{existing}\n\n"
         f"Izak's notes:\n<notes>\n{notes}\n</notes>"),
    ])

    by_id = {c["id"]: c for c in candidates}
    drafts = []
    for d in result.drafts:
        draft = d.model_dump()
        target = by_id.get(draft["merge_into"] or "")
        if target:
            # `answer` stays the new facts alone (for "Add as new"); merging uses
            # the existing question with the merged answer.
            draft["merge_title"] = target["title"]
            draft["merged_answer"] = merge_answer(target["body"], draft["answer"])
        else:
            # Ignore merge targets the model made up.
            draft["merge_into"] = draft["merge_reason"] = None
        drafts.append(draft)
    return drafts
