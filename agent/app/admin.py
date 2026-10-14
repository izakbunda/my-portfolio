"""Dashboard admin API for the knowledge base. Every route requires the
dashboard user's Supabase access token (Authorization: Bearer <token>)."""
import logging
from typing import Literal

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app import kb
from app.config import ADMIN_EMAIL
from app.kb_cleanup import cleanup
from app.retriever import _supabase

logger = logging.getLogger("izak-ai")


def require_admin(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing access token")
    try:
        user = _supabase.auth.get_user(authorization.removeprefix("Bearer ")).user
    except Exception:
        user = None
    if not user:
        raise HTTPException(401, "Invalid or expired session")
    if ADMIN_EMAIL and (user.email or "").lower() != ADMIN_EMAIL:
        raise HTTPException(403, "Not allowed")
    return user


router = APIRouter(prefix="/admin/kb", dependencies=[Depends(require_admin)])


class EntryIn(BaseModel):
    kind: Literal["qa", "doc"]
    title: str = Field(min_length=1, max_length=300)
    body: str = Field(default="", max_length=50_000)
    category: str | None = Field(default=None, max_length=80)


class EntryPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    body: str | None = Field(default=None, max_length=50_000)
    category: str | None = Field(default=None, max_length=80)


class CleanupIn(BaseModel):
    question: str | None = Field(default=None, max_length=300)
    text: str = Field(min_length=1, max_length=10_000)


# Sync handlers on purpose: FastAPI runs them in a threadpool, so the blocking
# Supabase / embedding calls don't stall the chat stream.

@router.get("/entries")
def list_entries():
    return kb.list_entries()


@router.post("/entries")
def create_entry(entry: EntryIn):
    return kb.create_entry(entry.model_dump())


@router.put("/entries/{entry_id}")
def update_entry(entry_id: str, patch: EntryPatch):
    updated = kb.update_entry(entry_id, patch.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(404, "Entry not found")
    return updated


@router.delete("/entries/{entry_id}")
def delete_entry(entry_id: str):
    kb.delete_entry(entry_id)
    return {"ok": True}


@router.get("/files")
def list_files():
    return kb.list_files()


@router.post("/files")
def upload_file(file: UploadFile = File(...)):
    data = file.file.read(kb.MAX_FILE_BYTES + 1)
    try:
        return kb.ingest_file(data, file.filename or "upload.txt")
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.delete("/files/{file_id}")
def delete_file(file_id: str):
    if not kb.delete_file(file_id):
        raise HTTPException(404, "File not found")
    return {"ok": True}


@router.post("/reindex")
def reindex():
    return kb.reindex_all()


@router.post("/cleanup")
def cleanup_braindump(req: CleanupIn):
    try:
        return {"drafts": cleanup(req.text, req.question)}
    except Exception:
        logger.exception("braindump cleanup failed")
        raise HTTPException(502, "The AI cleanup failed. Try again.")
