from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ml_service.core.security import verify_internal_token
from ml_service.pipelines.text_tokenization import analyze_prompt_safety

router = APIRouter(prefix="/advisor", tags=["advisor"])

class AdvisorRequest(BaseModel):
    session_id: str
    user_prompt_string: str
    farm_context: dict = {}

# Simple in-memory session state storage for conversational tracking
SESSION_HISTORY = {}

@router.post("/chat", dependencies=[Depends(verify_internal_token)])
async def chat_advisor(payload: AdvisorRequest):
    # 1. Safety Guardrails analysis
    is_safe, warning_message = analyze_prompt_safety(payload.user_prompt_string)
    if not is_safe:
        return {
            "response_text": f"Safety Flag Triggered: {warning_message}",
            "updated_session_id": payload.session_id
        }

    # Extract conversation history for session
    history = SESSION_HISTORY.get(payload.session_id, [])
    
    # 2. Extract farm variables
    crop = payload.farm_context.get("crop", "crops")
    stage = payload.farm_context.get("stage", "vegetative stage")
    state = payload.farm_context.get("state", "your state")
    district = payload.farm_context.get("district", "your district")
    soil = payload.farm_context.get("soil_profile", {})
    ph = soil.get("ph_level", 7.0)
    
    # Simple semantic router based on keywords
    prompt = payload.user_prompt_string.lower()
    
    # In-memory history check to track consecutive topics
    last_topic = history[-1].get("topic", None) if history else None

    if "pest" in prompt or "insect" in prompt or "bug" in prompt or last_topic == "pest":
        topic = "pest"
        if "rice" in crop.lower():
            response = f"For pests on {crop} in {district}, check for Stem Borer or Leaf Folder. Apply Chlorantraniliprole 18.5 SC @ 150 mL/ha. Spray when pest count exceeds 5% threshold."
        elif "wheat" in crop.lower():
            response = f"Wheat crops in {state} are prone to aphids or termites. Apply Imidacloprid 17.8 SL @ 100 mL/ha if infestation spreads."
        else:
            response = f"For pest management on {crop}, inspect under leaves for mites and thrips. Use standard Neem seed kernel extract (5% NSKE) as a safe biological prevention layer."

    elif "fertilizer" in prompt or "npk" in prompt or "urea" in prompt or last_topic == "fertilizer":
        topic = "fertilizer"
        n = soil.get("nitrogen_level", 40)
        p = soil.get("phosphorus_level", 15)
        k = soil.get("potassium_level", 20)
        
        response = f"For soil profile NPK: {n}-{p}-{k} mg/kg with pH {ph} (growing {crop}):\n"
        if n < 30:
            response += "- Nitrogen is low. Apply Urea @ 100-120 kg/ha divided into split doses.\n"
        else:
            response += "- Nitrogen levels are adequate. Avoid excess urea to prevent crop lodging.\n"
        if p < 15:
            response += "- Phosphorus is low. Apply Single Super Phosphate (SSP) @ 80 kg/ha at sowing.\n"
        if k < 20:
            response += "- Potassium is low. Apply Muriate of Potash (MOP) @ 40 kg/ha.\n"
        response += f"Note: Keep soil pH close to 6.5 for optimal crop absorption."

    elif "water" in prompt or "irrigation" in prompt or "dry" in prompt or last_topic == "water":
        topic = "water"
        if "sowing" in stage.lower():
            response = f"During the sowing stage of {crop}, keep soil uniformly moist but avoid water logging, which rots seeds."
        elif "flowering" in stage.lower():
            response = f"Flowering stage is critical for {crop}. Water deficit now can reduce grain yields by 40%. Irrigate weekly."
        else:
            response = f"For {crop} in {stage}, maintain consistent moisture levels. Overwatering invites fungal root rot."

    else:
        topic = "general"
        response = f"Greetings! As your AgriOS Advisor, I am tracking your {crop} farm records in {district}, {state}. Currently, your soil pH is {ph}. For optimal yield, focus on weed control and regular crop monitoring. How can I help you today?"

    # Update session history
    history.append({
        "prompt": payload.user_prompt_string,
        "response": response,
        "topic": topic
    })
    SESSION_HISTORY[payload.session_id] = history[-5:] # Keep last 5 messages to save memory

    return {
        "response_text": response,
        "updated_session_id": payload.session_id
    }
