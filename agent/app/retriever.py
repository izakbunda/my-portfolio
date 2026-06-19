from langchain_openai import OpenAIEmbeddings
from langchain_core.tools import tool
from supabase import create_client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY

_supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
_embedder = OpenAIEmbeddings(model="text-embedding-3-small", api_key=OPENAI_API_KEY)


@tool
def retrieve_context(query: str) -> str:
    """Search Izak's personal knowledge base for information relevant to the query.
    Use this whenever the user asks about Izak's background, projects, writing, opinions, or experience."""
    vector = _embedder.embed_query(query)
    result = _supabase.rpc("match_documents", {
        "query_embedding": vector,
        "match_count": 4,
    }).execute()
    if not result.data:
        return "No relevant context found."
    chunks = [f"[source: {row['source']}]\n{row['content']}" for row in result.data]
    return "\n\n---\n\n".join(chunks)
