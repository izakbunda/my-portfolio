from langchain_openai import OpenAIEmbeddings
from langchain_core.tools import tool
from supabase import create_client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY

_supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
_embedder = OpenAIEmbeddings(model="text-embedding-3-small", api_key=OPENAI_API_KEY)

MATCH_COUNT = 6


def search(query: str, match_count: int = MATCH_COUNT) -> list[dict]:
    """Nearest chunks to the query, best first. Shared by the agent tool and evals.

    A Q&A chunk can be stored twice (question vector + content vector), so fetch
    extra rows and keep each content's best match."""
    vector = _embedder.embed_query(query)
    result = _supabase.rpc("match_documents", {
        "query_embedding": vector,
        "match_count": match_count * 2,
    }).execute()
    seen, rows = set(), []
    for row in result.data or []:
        if row["content"] not in seen:
            seen.add(row["content"])
            rows.append(row)
    return rows[:match_count]


@tool
def retrieve_context(query: str) -> str:
    """Search Izak's personal knowledge base for information relevant to the query.
    Use this whenever the user asks about Izak's background, projects, writing, opinions, or experience."""
    rows = search(query)
    if not rows:
        return "No relevant context found."
    chunks = [f"[source: {row['source']}]\n{row['content']}" for row in rows]
    return "\n\n---\n\n".join(chunks)
