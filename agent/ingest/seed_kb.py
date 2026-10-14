"""One-time migration: markdown sources -> kb_entries (+ embeddings).

After this runs, the dashboard Knowledge tab is the source of truth and the
markdown files are no longer used. Safe to re-run only on an empty kb_entries
table (it refuses otherwise).

    cd agent && venv/bin/python ingest/seed_kb.py
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import kb  # noqa: E402
from app.retriever import _supabase  # noqa: E402

SOURCES_DIR = Path(__file__).parent / "sources"
_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)
_RULE = re.compile(r"^\s*(-{3,}|\*{3,}|_{3,})\s*$")

SITE_GUIDE = """\
Izak's portfolio (izakbunda.vercel.app) is built from scratch to look and feel like \
a vintage Mac OS desktop. Visitors open "apps" from the desktop icons or the dock, \
and each one opens in its own draggable window.

## What's on the desktop

- **Izak Bunda**: his profile, with a short intro and what he's interested in.
- **Resumé**: his full resume.
- **Projects**: personal and school projects (Libris, PIGZJ, Izakstagram, ReUCLA, \
Spotify Stats Hub and more), filterable by category.
- **Internships**: his internships at Hunter Industries and Hussle.
- **Izak AI**: this chat assistant, which answers questions about Izak.
- **Photography**: albums of his photos.
- The dock at the bottom holds LinkedIn and GitHub links plus any minimized windows. \
The menu bar shows the time and an About item.

## How it's built

The frontend is React + Vite, deployed on Vercel. Izak AI is a FastAPI backend running \
a LangGraph agent (DeepSeek model) with retrieval over a Supabase pgvector knowledge base, \
deployed on Railway. Supabase also handles the photo gallery, site analytics and a private \
dashboard where Izak edits what the assistant knows. The window manager (dragging, \
resizing, stacking, minimizing, remembering open windows between visits) is hand-built.

## Easter eggs

There are a handful of hidden interactions, and a secret window that lists them, \
reachable from the menu bar. Hint at them playfully without spelling them out: \
for example, that the desktop reacts to more than a left click, that windows can do \
more than they let on, and that it's worth poking around the menu bar."""


def clean(text: str) -> list[str]:
    return [l for l in _COMMENT.sub("", text).splitlines() if not _RULE.match(l)]


def short(h1: str) -> str:
    return re.sub(r"\s+—\s+Izak Bunda$", "", h1).strip()


def parse_qa(text: str) -> list[dict]:
    """`## Question` sections become Q&A entries. A `##` heading with no body
    right before another `##` is a category label for the questions under it."""
    sections: list[tuple[str, list[str]]] = []
    for line in clean(text):
        if line.startswith("## "):
            sections.append((line[3:].strip(), []))
        elif sections and not line.startswith("# "):
            sections[-1][1].append(line)

    entries, category, sort = [], None, 0
    for title, body_lines in sections:
        body = "\n".join(body_lines).strip()
        if not body:
            category = title
            continue
        entries.append({"kind": "qa", "title": title, "body": body, "category": category, "sort": sort})
        sort += 1
    return entries


def parse_docs(text: str) -> list[dict]:
    """Each `##` section becomes a doc entry, grouped (category) by its `#`
    heading. Text between a `#` and its first `##` becomes an entry titled by the `#`."""
    entries, h1, title, body, sort = [], None, None, [], 0

    def flush():
        nonlocal sort
        content = "\n".join(body).strip()
        if content and (title or h1):
            entries.append({"kind": "doc", "title": title or h1, "body": content, "category": h1, "sort": sort})
            sort += 1
        body.clear()

    for line in clean(text):
        if line.startswith("# "):
            flush()
            h1, title = short(line[2:]), None
        elif line.startswith("## "):
            flush()
            title = line[3:].strip()
        else:
            body.append(line)
    flush()
    return entries


def parse_essays(text: str, category: str = "Writing") -> list[dict]:
    """Each `#` block (an essay, sub-sections included) becomes one doc entry."""
    entries, title, body = [], None, []

    def flush():
        content = "\n".join(body).strip()
        if content and title:
            entries.append({"kind": "doc", "title": title, "body": content, "category": category, "sort": len(entries)})
        body.clear()

    for line in clean(text):
        if line.startswith("# "):
            flush()
            title = short(line[2:])
        else:
            body.append(line)
    flush()
    return entries


def main():
    existing = _supabase.table("kb_entries").select("id", count="exact").limit(1).execute().count
    if existing:
        sys.exit(f"kb_entries already has {existing} rows; refusing to seed twice.")

    entries = parse_qa((SOURCES_DIR / "qa.md").read_text())
    for name in ("resume.md", "projects.md"):
        entries += parse_docs((SOURCES_DIR / name).read_text())
    entries += parse_essays((SOURCES_DIR / "substack.md").read_text())
    entries.append({"kind": "doc", "title": "About this website", "body": SITE_GUIDE,
                    "category": "Website", "sort": 0})

    # Legacy chunks from ingest.py have no owner; replace them wholesale.
    _supabase.table("documents").delete().is_("entry_id", "null").is_("file_id", "null").execute()

    for i, entry in enumerate(entries, 1):
        kb.create_entry(entry)
        print(f"[{i}/{len(entries)}] {entry['kind']:3} {entry.get('category') or '':28} {entry['title'][:60]}")
    print(f"\nSeeded {len(entries)} entries.")


if __name__ == "__main__":
    main()
