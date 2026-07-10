from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from core.model_registry import model_registry
from core.security import verify_internal_token
from pipelines.image_preprocessing import preprocess_image

router = APIRouter(tags=["vision"])


@router.post("/diagnose", dependencies=[Depends(verify_internal_token)])
async def diagnose(image: UploadFile = File(...), farm_id: str = Form(default=None)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported.")

    image_bytes = await image.read()
    if len(image_bytes) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image exceeds 8MB upload cap.")

    tensor = preprocess_image(image_bytes)
    disease, confidence, remediation = model_registry.classify_image(tensor)

    return {
        "disease": disease,
        "confidence": round(confidence, 4),
        "remediation_protocol": remediation,
        "farm_id": farm_id,
    }
