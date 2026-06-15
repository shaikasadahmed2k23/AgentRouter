from dotenv import load_dotenv
import os

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL")
UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Groq models — 3 tiers for cost-aware routing
MODELS = {
    "simple":  "llama-3.1-8b-instant",
    "medium":  "llama-3.3-70b-versatile",
    "complex": "llama-3.3-70b-versatile",  # DeepSeek decommissioned, use 70b
}

# Complexity thresholds (score out of 10)
COMPLEXITY_THRESHOLDS = {
    "simple":  (0, 4),
    "medium":  (5, 7),
    "complex": (8, 10),
}

CACHE_TTL = 3600  # 1 hour cache