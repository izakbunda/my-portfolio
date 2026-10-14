from langchain_openai import ChatOpenAI
from app.config import DEEPSEEK_API_KEY


def deepseek(temperature: float = 0.3) -> ChatOpenAI:
    return ChatOpenAI(
        model="deepseek-chat",
        base_url="https://api.deepseek.com",
        api_key=DEEPSEEK_API_KEY,
        temperature=temperature,
    )
