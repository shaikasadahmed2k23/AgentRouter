from datetime import datetime
from typing import Optional
from core.supabase_client import supabase

def log_request(
    query: str,
    complexity: str,
    complexity_score: int,
    model_used: str,
    latency_ms: float,
    tokens_used: int,
    cache_hit: bool,
    subtasks_count: int,
    subtasks: list,
    routing_reasoning: str = "",
    answer: str = "",
):
    estimated_cost = estimate_cost(model_used, tokens_used)
    entry = {
        "query_preview": query[:80],
        "full_query": query,
        "complexity": complexity,
        "complexity_score": complexity_score,
        "model_used": model_used,
        "latency_ms": round(latency_ms, 2),
        "tokens_used": tokens_used,
        "cache_hit": cache_hit,
        "estimated_cost_usd": estimated_cost,
        "subtasks_count": subtasks_count,
        "subtasks": subtasks,
        "routing_reasoning": routing_reasoning,
        "answer": answer[:500],
    }
    try:
        supabase.table("requests").insert(entry).execute()
    except Exception as e:
        print(f"Supabase log error: {e}")
    return {**entry, "estimated_cost_usd": estimated_cost}

def estimate_cost(model: str, tokens: int) -> float:
    rates = {
        "llama-3.1-8b-instant":    0.00005,
        "llama-3.3-70b-versatile": 0.00059,
    }
    rate = rates.get(model, 0.001)
    return round((tokens / 1000) * rate, 6)

def get_metrics_summary() -> dict:
    try:
        # Total requests
        all_rows = supabase.table("requests").select("*").order("created_at", desc=True).execute()
        rows = all_rows.data or []

        if not rows:
            return {"total_requests": 0}

        total = len(rows)
        cache_hits = sum(1 for r in rows if r["cache_hit"])
        avg_latency = sum(r["latency_ms"] for r in rows) / total
        total_cost = sum(r["estimated_cost_usd"] for r in rows)

        model_dist: dict = {}
        for r in rows:
            model_dist[r["model_used"]] = model_dist.get(r["model_used"], 0) + 1

        # Cost savings vs GPT-4o (benchmark: $0.03 per 1K tokens)
        total_tokens = sum(r["tokens_used"] for r in rows)
        gpt4o_cost = round((total_tokens / 1000) * 0.03, 6)
        savings = round(gpt4o_cost - total_cost, 6)
        savings_pct = round((savings / gpt4o_cost * 100), 1) if gpt4o_cost > 0 else 0

        recent = rows[:10]

        return {
            "total_requests": total,
            "cache_hit_rate": round(cache_hits / total * 100, 1),
            "avg_latency_ms": round(avg_latency, 2),
            "total_cost_usd": round(total_cost, 6),
            "total_tokens": total_tokens,
            "gpt4o_equivalent_cost": gpt4o_cost,
            "cost_savings_usd": savings,
            "cost_savings_pct": savings_pct,
            "model_distribution": model_dist,
            "recent": recent,
        }
    except Exception as e:
        print(f"Supabase metrics error: {e}")
        return {"total_requests": 0}