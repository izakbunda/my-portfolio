import os
import sys
from pathlib import Path

# allow running from repo root or agent/ dir
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from langchain_openai import OpenAIEmbeddings
from supabase import create_client

from app.chunking import chunk_markdown

SOURCES_DIR = Path(__file__).parent / "sources"


def main():
    supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
    embedder = OpenAIEmbeddings(model="text-embedding-3-small", api_key=os.environ["OPENAI_API_KEY"])

    # Clear existing rows so re-ingestion is idempotent
    supabase.table("documents").delete().neq("id", 0).execute()

    all_rows = []
    source_files = list(SOURCES_DIR.glob("*.md"))
    for path in source_files:
        text = path.read_text()
        if not text.strip() or "FILL IN" in text:
            print(f"Skipping {path.name} — placeholder or empty")
            continue
        source = path.stem
        chunks = chunk_markdown(text)
        vectors = embedder.embed_documents([c.embed_text for c in chunks])
        for chunk, vec in zip(chunks, vectors):
            all_rows.append({"content": chunk.content, "embedding": vec, "source": source})

    if not all_rows:
        print("No rows to insert. Fill in the source markdown files first.")
        return

    BATCH = 100
    for i in range(0, len(all_rows), BATCH):
        supabase.table("documents").insert(all_rows[i:i + BATCH]).execute()

    print(f"Inserted {len(all_rows)} chunks from {len(source_files)} source files")


if __name__ == "__main__":
    main()
