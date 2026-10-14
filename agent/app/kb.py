"""Knowledge base storage: entries/files in Supabase, chunks + embeddings in
`documents`. Every write re-embeds just the affected entry or file, so the
dashboard and the chat agent never drift apart."""
import io
import uuid
from datetime import datetime, timezone
from pathlib import PurePath

from pypdf import PdfReader

from app.chunking import Chunk, chunk_markdown
from app.retriever import _embedder, _supabase

BUCKET = "kb-files"
ALLOWED_FILE_TYPES = {
    ".md": "text/markdown",
    ".txt": "text/plain",
    ".pdf": "application/pdf",
}
MAX_FILE_BYTES = 10 * 1024 * 1024
ENTRY_FIELDS = "id, kind, title, body, category, sort, created_at, updated_at, embedded_at"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- chunking ----------

def entry_chunks(entry: dict) -> list[Chunk]:
    title, body = entry["title"].strip(), entry["body"].strip()
    if not body:
        return []
    if entry["kind"] == "qa":
        chunks = chunk_markdown(f"## {title}\n\n{body}", doc_title="Q&A")
        # Q&A titles are questions even without a trailing "?"; give each one a
        # question-only vector so visitor questions land on it (see chunking.py).
        if len(chunks) == 1 and chunks[0].embed_text != title:
            chunks.append(Chunk(chunks[0].content, title))
        return chunks
    category = (entry.get("category") or "").strip()
    root = f"{category} > {title}" if category and category != title else title
    return chunk_markdown(body, doc_title=root)


def _store_chunks(chunks: list[Chunk], source: str, **owner) -> int:
    if not chunks:
        return 0
    vectors = _embedder.embed_documents([c.embed_text for c in chunks])
    rows = [
        {"content": c.content, "embedding": v, "source": source, **owner}
        for c, v in zip(chunks, vectors)
    ]
    for i in range(0, len(rows), 100):
        _supabase.table("documents").insert(rows[i:i + 100]).execute()
    return len(rows)


# ---------- entries ----------

def list_entries() -> list[dict]:
    return (
        _supabase.table("kb_entries").select(ENTRY_FIELDS)
        .order("kind").order("sort").order("created_at")
        .execute().data
    )


def get_entry(entry_id: str) -> dict | None:
    rows = _supabase.table("kb_entries").select(ENTRY_FIELDS).eq("id", entry_id).execute().data
    return rows[0] if rows else None


def reembed_entry(entry: dict) -> dict:
    _supabase.table("documents").delete().eq("entry_id", entry["id"]).execute()
    source = "qa" if entry["kind"] == "qa" else (entry.get("category") or entry["title"])
    _store_chunks(entry_chunks(entry), source, entry_id=entry["id"])
    return (
        _supabase.table("kb_entries").update({"embedded_at": _now()})
        .eq("id", entry["id"]).execute().data[0]
    )


def create_entry(fields: dict) -> dict:
    entry = _supabase.table("kb_entries").insert(fields).execute().data[0]
    return reembed_entry(entry)


def update_entry(entry_id: str, fields: dict) -> dict | None:
    rows = (
        _supabase.table("kb_entries").update({**fields, "updated_at": _now()})
        .eq("id", entry_id).execute().data
    )
    return reembed_entry(rows[0]) if rows else None


def delete_entry(entry_id: str) -> None:
    # documents rows go with it (on delete cascade)
    _supabase.table("kb_entries").delete().eq("id", entry_id).execute()


# ---------- files ----------

def extract_text(data: bytes, ext: str) -> str:
    if ext == ".pdf":
        reader = PdfReader(io.BytesIO(data))
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)
    return data.decode("utf-8", errors="replace")


def list_files() -> list[dict]:
    return _supabase.table("kb_files").select("*").order("created_at", desc=True).execute().data


def ingest_file(data: bytes, name: str) -> dict:
    """Store the original, chunk + embed its text. Raises ValueError on bad input."""
    ext = PurePath(name).suffix.lower()
    if ext not in ALLOWED_FILE_TYPES:
        raise ValueError("Only .md, .txt and .pdf files are supported.")
    if len(data) > MAX_FILE_BYTES:
        raise ValueError("File is larger than 10 MB.")
    text = extract_text(data, ext)
    if not text.strip():
        raise ValueError("No text found in this file (scanned PDFs aren't supported).")

    mime = ALLOWED_FILE_TYPES[ext]
    path = f"{uuid.uuid4()}/{name}"
    _supabase.storage.from_(BUCKET).upload(path, data, {"content-type": mime})
    file_row = _supabase.table("kb_files").insert({
        "name": name, "storage_path": path, "mime": mime, "size": len(data),
    }).execute().data[0]

    count = _store_chunks(chunk_markdown(text, doc_title=PurePath(name).stem), name, file_id=file_row["id"])
    return (
        _supabase.table("kb_files").update({"chunk_count": count})
        .eq("id", file_row["id"]).execute().data[0]
    )


def delete_file(file_id: str) -> bool:
    rows = _supabase.table("kb_files").select("storage_path").eq("id", file_id).execute().data
    if not rows:
        return False
    _supabase.storage.from_(BUCKET).remove([rows[0]["storage_path"]])
    _supabase.table("kb_files").delete().eq("id", file_id).execute()
    return True


# ---------- maintenance ----------

def reindex_all() -> dict:
    """Re-embed every entry and file, e.g. after a chunking change."""
    entries = list_entries()
    for entry in entries:
        reembed_entry(entry)
    files = list_files()
    for f in files:
        data = _supabase.storage.from_(BUCKET).download(f["storage_path"])
        _supabase.table("documents").delete().eq("file_id", f["id"]).execute()
        ext = PurePath(f["name"]).suffix.lower()
        count = _store_chunks(
            chunk_markdown(extract_text(data, ext), doc_title=PurePath(f["name"]).stem),
            f["name"], file_id=f["id"],
        )
        _supabase.table("kb_files").update({"chunk_count": count}).eq("id", f["id"]).execute()
    return {"entries": len(entries), "files": len(files)}
