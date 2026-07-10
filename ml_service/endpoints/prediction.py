from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from core.model_registry import model_registry
from core.security import verify_internal_token

router = APIRouter(tags=["prediction"])


class YieldRequest(BaseModel):
    crop_cycle_id: str | None = None
    farm_data: dict = Field(default_factory=dict)


class PriceForecastRequest(BaseModel):
    crop_name: str
    price_history: dict = Field(default_factory=dict)


@router.post("/predict-yield", dependencies=[Depends(verify_internal_token)])
def predict_yield(payload: YieldRequest):
    farm_data = payload.farm_data or {}
    area = farm_data.get("area")
    soil_profile = farm_data.get("soil_profile") or {}
    crop_name = farm_data.get("crop_name")

    if area is None or not crop_name:
        raise HTTPException(status_code=400, detail="farm_data.area and farm_data.crop_name are required.")

    predicted_yield, variance = model_registry.predict_yield(area, soil_profile, crop_name)
    return {
        "predicted_yield": round(predicted_yield, 2),
        "variance": round(variance, 4),
        "crop_cycle_id": payload.crop_cycle_id,
    }


@router.post("/predict-prices", dependencies=[Depends(verify_internal_token)])
def predict_prices(payload: PriceForecastRequest):
    history = payload.price_history or {}
    p90 = history.get("p90")
    p60 = history.get("p60")
    p30 = history.get("p30")

    if p30 is None:
        raise HTTPException(status_code=400, detail="price_history.p30 is required for forecasting.")

    return model_registry.forecast_prices(payload.crop_name, p90, p60, p30)
