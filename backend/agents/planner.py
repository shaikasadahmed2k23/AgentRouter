from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from core.config import GROQ_API_KEY
import json

llm = ChatGroq(api_key=GROQ_API_KEY, model="llama-3.1-8b-instant", temperature=0)

PLANNER_SYSTEM = """You are a task complexity scoring agent. Analyze the user query and score its complexity.

COMPLEXITY RULES — follow strictly:
- Score 1-4 (SIMPLE): Basic facts, simple math, one-word answers, greetings, definitions, yes/no questions
  Examples: "What is 2+2?", "Capital of France?", "What is Python?", "Hi", "What color is the sky?"
- Score 5-7 (MEDIUM): Explanations, summaries, how-things-work, short essays, comparisons
  Examples: "Explain neural networks", "Compare SQL vs NoSQL", "How does Redis work?"
- Score 8-10 (COMPLEX): System design, deep analysis, multi-step reasoning, architecture, research
  Examples: "Design a ride-sharing system", "Analyze microservices vs monolith in depth"

Respond ONLY with valid JSON, no markdown, no extra text:
{"subtasks":["task1"],"complexity_score":2,"complexity_label":"simple","reasoning":"one line reason"}"""

def plan_task(query: str) -> dict:
    try:
        response = llm.invoke([
            SystemMessage(content=PLANNER_SYSTEM),
            HumanMessage(content=f"Score this query: {query}")
        ])
        raw = response.content.strip()
        # Strip markdown fences if present
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())
    except Exception as e:
        # Smarter fallback based on query length
        q = query.strip()
        if len(q) < 30:
            score, label = 2, "simple"
        elif len(q) < 80:
            score, label = 5, "medium"
        else:
            score, label = 8, "complex"
        return {
            "subtasks": [q],
            "complexity_score": score,
            "complexity_label": label,
            "reasoning": f"Fallback scoring: {str(e)}"
        }