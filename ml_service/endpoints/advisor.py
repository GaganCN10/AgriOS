from uuid import uuid4
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from pipelines.text_tokenization import analyze_prompt_safety

router = APIRouter(tags=["advisor"])

SESSION_STORE: dict[str, list[dict]] = {}


class ChatRequest(BaseModel):
    session_id: str | None = None
    user_prompt: str
    user_id: str | None = None
    farm_context: dict | None = None


def _build_context_summary(farm_context: dict | None) -> str:
    if not farm_context:
        return "No active farm context was supplied."

    soil = farm_context.get("soil_profile") or {}
    return (
        f"Farm: {farm_context.get('farm_name', 'Unknown')} in "
        f"{farm_context.get('district', 'N/A')}, {farm_context.get('state', 'N/A')}. "
        f"Active crop: {farm_context.get('active_crop') or 'None'}. "
        f"Stage: {farm_context.get('crop_stage') or 'N/A'}. "
        f"Soil NPK/pH: N={soil.get('nitrogen_level', 0)}, P={soil.get('phosphorus_level', 0)}, "
        f"K={soil.get('potassium_level', 0)}, pH={soil.get('ph_level', 7.0)}."
    )


def _generate_agronomic_response(prompt: str, farm_context: dict | None) -> tuple[str, str | None]:
    normalized = prompt.lower()
    context_summary = _build_context_summary(farm_context)
    soil = (farm_context or {}).get("soil_profile") or {}
    active_crop = (farm_context or {}).get("active_crop") or "your crop"

    if any(keyword in normalized for keyword in ["nitrogen", "urea", "fertilizer", "npk"]):
        nitrogen = soil.get("nitrogen_level", 0)
        if nitrogen < 35:
            return (
                f"Based on your soil profile ({context_summary}), nitrogen appears low. "
                f"For {active_crop}, schedule a split urea application during active vegetative growth "
                "and avoid heavy nitrogen during late maturity to reduce lodging risk.",
                None,
            )
        return (
            f"Your current nitrogen level looks adequate ({nitrogen} mg/kg). "
            f"For {active_crop}, maintain balanced NPK and monitor leaf colour through the next irrigation cycle.",
            None,
        )

    if any(keyword in normalized for keyword in ["water", "irrigate", "irrigation", "rain"]):
        return (
            f"For {active_crop}, maintain field moisture during tillering/vegetative phases and reduce "
            "standing water before harvest. Align irrigation with local rainfall forecasts to avoid water stress.",
            None,
        )

    if any(keyword in normalized for keyword in ["pest", "disease", "fungus", "blast", "spot"]):
        return (
            f"Given {context_summary}, inspect lower canopy leaves first. If lesions spread rapidly, "
            "capture leaf images in the diagnostics module and isolate affected plots before chemical intervention.",
            None,
        )

    if any(keyword in normalized for keyword in ["yield", "harvest", "production"]):
        return (
            f"Yield outcomes for {active_crop} depend on sowing date, soil fertility, and late-season moisture. "
            "Use the yield prediction engine on your active crop cycle for a model-backed tonnage estimate.",
            None,
        )

    return (
        f"I reviewed your farm context: {context_summary} "
        "Ask about fertilizer schedules, irrigation intervals, pest management, or harvest planning for targeted guidance.",
        None,
    )


@router.post("/chat")
def advisor_chat(payload: ChatRequest):
    is_safe, warning = analyze_prompt_safety(payload.user_prompt)
    if not is_safe:
        return {
            "response_text": warning,
            "updated_session_id": payload.session_id or str(uuid4()),
            "warning": "Safety guardrail triggered.",
        }

    session_id = payload.session_id or str(uuid4())
    history = SESSION_STORE.setdefault(session_id, [])
    history.append({"role": "user", "content": payload.user_prompt})

    response_text, advisory_warning = _generate_agronomic_response(payload.user_prompt, payload.farm_context)
    history.append({"role": "assistant", "content": response_text})

    return {
        "response_text": response_text,
        "updated_session_id": session_id,
        "warning": advisory_warning,
    }
