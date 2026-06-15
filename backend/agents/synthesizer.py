from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from core.config import GROQ_API_KEY

llm = ChatGroq(api_key=GROQ_API_KEY, model="llama-3.1-8b-instant", temperature=0.2)

SYNTH_SYSTEM = """You are a synthesis agent. 
Given a user query and results from multiple subtasks, combine them into one clean, coherent final answer.
Be concise, clear and well-formatted. Do not mention the subtasks or internal process."""

def synthesize(original_query: str, subtask_results: list[dict]) -> str:
    if len(subtask_results) == 1:
        return subtask_results[0]["result"]
    
    combined = "\n\n".join([
        f"Subtask {i+1} result:\n{r['result']}"
        for i, r in enumerate(subtask_results)
    ])
    
    try:
        response = llm.invoke([
            SystemMessage(content=SYNTH_SYSTEM),
            HumanMessage(content=f"Original query: {original_query}\n\n{combined}")
        ])
        return response.content
    except Exception:
        return subtask_results[0]["result"]