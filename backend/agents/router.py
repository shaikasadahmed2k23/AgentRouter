from core.config import MODELS, COMPLEXITY_THRESHOLDS

def route_to_model(complexity_score: int) -> tuple[str, str]:
    """Returns (model_id, tier_label)"""
    for tier, (low, high) in COMPLEXITY_THRESHOLDS.items():
        if low <= complexity_score <= high:
            return MODELS[tier], tier
    return MODELS["medium"], "medium"