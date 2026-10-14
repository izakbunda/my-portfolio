"""Heading-aware markdown chunking.

Every chunk is one markdown section (the text under the deepest heading),
prefixed with its heading path, e.g.

    Q&A — Izak Bunda > What does Izak do?

    Izak is a Software Engineer at KPMG...

Keeping the question/heading in the same chunk as its answer is what makes a
visitor's question land on the right chunk. Sections longer than MAX_CHARS are
split further, and every piece keeps the heading prefix.

Sections whose heading is a question also get a second vector embedded from the
question alone (same content). Visitor questions match a written question far
more tightly than they match a long answer, so Q&A entries rank first when
someone asks them more or less as written.
"""
import re
from dataclasses import dataclass

from langchain_text_splitters import RecursiveCharacterTextSplitter

MAX_CHARS = 1200

_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)
_HEADING = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
_RULE = re.compile(r"^\s*(-{3,}|\*{3,}|_{3,})\s*$")

_splitter = RecursiveCharacterTextSplitter(chunk_size=MAX_CHARS, chunk_overlap=100)


@dataclass
class Chunk:
    content: str     # what the agent reads
    embed_text: str  # what gets embedded for search


def chunk_markdown(text: str, doc_title: str | None = None) -> list[Chunk]:
    """Split markdown into heading-prefixed chunks. `doc_title` roots the heading
    path when the text has no top-level heading of its own."""
    text = _COMMENT.sub("", text)
    stack: list[tuple[int, str]] = [(0, doc_title)] if doc_title else []
    body: list[str] = []
    chunks: list[Chunk] = []

    def flush():
        content = "\n".join(body).strip()
        body.clear()
        if not content:
            return
        prefix = " > ".join(title for _, title in stack)
        pieces = _splitter.split_text(content) if len(content) > MAX_CHARS else [content]
        for piece in pieces:
            full = f"{prefix}\n\n{piece}" if prefix else piece
            chunks.append(Chunk(full, full))
        heading = stack[-1][1] if stack else ""
        if heading.endswith("?") and len(pieces) == 1:
            chunks.append(Chunk(chunks[-1].content, heading))

    for line in text.splitlines():
        if _RULE.match(line):
            continue
        heading = _HEADING.match(line)
        if heading:
            flush()
            level = len(heading.group(1))
            while stack and stack[-1][0] >= level:
                stack.pop()
            stack.append((level, heading.group(2)))
        else:
            body.append(line)
    flush()
    return chunks
