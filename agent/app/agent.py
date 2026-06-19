from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from app.retriever import retrieve_context
from app.config import DEEPSEEK_API_KEY

SYSTEM_PROMPT = """You are a chatbot embedded on Izak Bunda's personal portfolio website. \
You answer questions about Izak — his background, work, projects, writing, and interests — on his behalf.

Use the retrieve_context tool whenever a question requires specific information about him. \
Don't guess; retrieve first. If retrieved context doesn't cover the question, say so honestly \
rather than inventing details.

Tone: conversational, warm, concise. Speak about Izak in third person. \
Decline off-topic questions politely and redirect to questions about Izak."""

llm = ChatOpenAI(
    model="deepseek-chat",
    base_url="https://api.deepseek.com",
    api_key=DEEPSEEK_API_KEY,
    temperature=0.3,
)

agent = create_react_agent(
    model=llm,
    tools=[retrieve_context],
    prompt=SYSTEM_PROMPT,
)
