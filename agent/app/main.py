import json
import re
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.agent import agent

limiter = Limiter(key_func=get_remote_address)

# Patterns that indicate prompt injection / jailbreak attempts.
# Checked against the latest user message before hitting the LLM.
_JAILBREAK_PATTERNS = re.compile(
    r"ignore (your |all )?(previous |prior |above |system )?instructions?"
    r"|you are now"
    r"|act as (a |an )?(different|new|unrestricted|free|unfiltered|jailbroken|evil|dan\b)"
    r"|\bdan\b.*mode"
    r"|pretend (you are|to be) (a )?(different|general|unrestricted)"
    r"|forget (your |all )?(previous |prior )?instructions?"
    r"|reveal (your |the )?(system )?prompt"
    r"|what (are|were) your instructions"
    r"|override (your )?(safety|content|system)"
    r"|disregard (your |all )?",
    re.IGNORECASE,
)

_JAILBREAK_REPLY = (
    "I'm just here to answer questions about Izak. What would you like to know about him?"
)


async def _canned_stream(text: str):
    yield f"data: {json.dumps({'type': 'text', 'content': text})}\n\n"
    yield "data: [DONE]\n\n"

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    # TODO: add your Vercel production URL here, e.g. "https://your-portfolio.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]


@app.post("/chat")
@limiter.limit("10/minute")
async def chat(request: Request, req: ChatRequest):
    # Pre-flight: catch obvious jailbreak attempts before touching the LLM.
    user_messages = [m for m in req.messages if m.role == "user"]
    if user_messages:
        last_user_text = user_messages[-1].content
        if _JAILBREAK_PATTERNS.search(last_user_text):
            return StreamingResponse(_canned_stream(_JAILBREAK_REPLY), media_type="text/event-stream")

    async def event_stream():
        async for event in agent.astream_events(
            {"messages": [m.model_dump() for m in req.messages]},
            version="v2",
        ):
            kind = event["event"]
            if kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if chunk.content:
                    yield f"data: {json.dumps({'type': 'text', 'content': chunk.content})}\n\n"
            elif kind == "on_tool_start":
                yield f"data: {json.dumps({'type': 'tool_start', 'name': event['name']})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/health")
def health():
    return {"ok": True}
