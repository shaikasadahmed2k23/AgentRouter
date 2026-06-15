from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents.planner import plan_task
from agents.router import route_to_model
from agents.executor import execute_subtask
from agents.synthesizer import synthesize
from core.cache import get_cached, set_cache
from core.metrics import log_request, get_metrics_summary
from core.config import GROQ_API_KEY, MODELS
from groq import Groq
import time
import json

router = APIRouter()
groq_client = Groq(api_key=GROQ_API_KEY)

class QueryRequest(BaseModel):
    query: str

class StreamRequest(BaseModel):
    query: str
    model: str = "llama-3.3-70b-versatile"

@router.post("/query")
async def handle_query(req: QueryRequest):
    start = time.time()
    query = req.query.strip()

    # 1. Cache check
    cached = get_cached(query)
    if cached:
        return {**cached, "cache_hit": True}

    # 2. Plan
    plan = plan_task(query)
    complexity_score = plan.get("complexity_score", 5)
    complexity_label = plan.get("complexity_label", "medium")
    subtasks = plan.get("subtasks", [query])
    reasoning = plan.get("reasoning", "")

    # 3. Route
    model_id, tier = route_to_model(complexity_score)

    # 4. Execute
    results = [execute_subtask(task, model_id) for task in subtasks]

    # 5. Synthesize
    final_answer = synthesize(query, results)

    total_latency = (time.time() - start) * 1000
    total_tokens = sum(r["tokens"] for r in results)

    # 6. Log to Supabase
    metric = log_request(
        query=query,
        complexity=tier,
        complexity_score=complexity_score,
        model_used=model_id,
        latency_ms=total_latency,
        tokens_used=total_tokens,
        cache_hit=False,
        subtasks_count=len(subtasks),
        subtasks=subtasks,
        routing_reasoning=reasoning,
        answer=final_answer,
    )

    response = {
        "answer": final_answer,
        "plan": plan,
        "model_used": model_id,
        "tier": tier,
        "complexity_score": complexity_score,
        "routing_reasoning": reasoning,
        "subtasks": subtasks,
        "latency_ms": round(total_latency, 2),
        "tokens_used": total_tokens,
        "subtasks_count": len(subtasks),
        "cache_hit": False,
        "estimated_cost_usd": metric["estimated_cost_usd"],
    }

    set_cache(query, response)
    return response

@router.post("/query/stream")
async def stream_query(req: StreamRequest):
    """Streaming endpoint — returns SSE stream"""
    def generate():
        try:
            completion = groq_client.chat.completions.create(
                model=req.model,
                messages=[{"role": "user", "content": req.query}],
                stream=True,
                max_tokens=1024,
            )
            for chunk in completion:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield f"data: {json.dumps({'token': delta})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

@router.get("/metrics")
async def get_metrics():
    return get_metrics_summary()

@router.delete("/cache/clear")
async def clear_cache():
    from core.cache import redis
    try:
        keys = redis.keys("agentrouter:*")
        if keys:
            redis.delete(*keys)
        return {"status": "cleared", "keys_deleted": len(keys)}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@router.get("/health")
async def health():
    return {"status": "ok", "service": "AgentRouter"}