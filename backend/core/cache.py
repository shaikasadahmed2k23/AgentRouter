from upstash_redis import Redis
from core.config import UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CACHE_TTL
import hashlib
import json

redis = Redis(
    url=UPSTASH_REDIS_REST_URL,
    token=UPSTASH_REDIS_REST_TOKEN
)

def make_cache_key(query: str) -> str:
    return "agentrouter:" + hashlib.md5(query.lower().strip().encode()).hexdigest()

def get_cached(query: str) -> dict | None:
    try:
        key = make_cache_key(query)
        val = redis.get(key)
        if val:
            return json.loads(val)
    except Exception:
        pass
    return None

def set_cache(query: str, result: dict):
    try:
        key = make_cache_key(query)
        redis.set(key, json.dumps(result), ex=CACHE_TTL)
    except Exception:
        pass