from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from core.config import GROQ_API_KEY
import time

EXECUTOR_SYSTEM = """You are a precise, helpful AI assistant. 
Answer the given task clearly and concisely.
Be accurate and well-structured in your response."""

def execute_subtask(subtask: str, model_id: str) -> dict:
    start = time.time()
    llm = ChatGroq(api_key=GROQ_API_KEY, model=model_id, temperature=0.3)
    try:
        response = llm.invoke([
            SystemMessage(content=EXECUTOR_SYSTEM),
            HumanMessage(content=subtask)
        ])
        latency = (time.time() - start) * 1000
        content = response.content
        tokens = response.usage_metadata.get("total_tokens", 0) if response.usage_metadata else 0
        return {
            "result": content,
            "latency_ms": latency,
            "tokens": tokens,
            "model": model_id,
            "success": True
        }
    except Exception as e:
        latency = (time.time() - start) * 1000
        return {
            "result": f"Error: {str(e)}",
            "latency_ms": latency,
            "tokens": 0,
            "model": model_id,
            "success": False
        }