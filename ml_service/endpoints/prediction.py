import pickle
import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ml_service.core.config import settings
from ml_service.core.security import verify_internal_token

router = APIRouter(prefix="/prediction", tags=["prediction"])

class SoilProfile(BaseModel):
    nitrogen_level: float
    phosphorus_level: float
    potassium_level: float
    ph_level: float

class YieldRequest(BaseModel):
    crop_name: str
    crop_variety: str
    calculated_area_hectares: float
    soil_profile: SoilProfile
    atmospheric_override: bool = False

class PriceRequest(BaseModel):
    crop_name: str
    state: str
    district: str
    last_price_90_days: float = 4000.0
    last_price_60_days: float = 4100.0
    last_price_30_days: float = 4200.0

# Helper to map crop name to code index
def get_crop_code(crop_name: str) -> int:
    crop_map = {
        "rice": 0,
        "wheat": 1,
        "tomato": 2,
        "onion": 3,
        "potato": 4
    }
    return crop_map.get(crop_name.lower(), 0)

@router.post("/yield", dependencies=[Depends(verify_internal_token)])
async def predict_yield(payload: YieldRequest):
    try:
        # Load yield regressor model from pkl
        with open(settings.YIELD_MODEL_PATH, "rb") as f:
            model = pickle.load(f)
            
        crop_code = get_crop_code(payload.crop_name)
        
        # Prepare input features vector: [hectares, n, p, k, ph, crop_code]
        features = np.array([[
            payload.calculated_area_hectares,
            payload.soil_profile.nitrogen_level,
            payload.soil_profile.phosphorus_level,
            payload.soil_profile.potassium_level,
            payload.soil_profile.ph_level,
            crop_code
        ]])
        
        # Operational inference
        prediction = model.predict(features)[0]
        
        # Apply atmospheric weather adjustment factor if override is flagged
        if payload.atmospheric_override:
            # Simulate a 12% crop loss due to weather stresses
            prediction = prediction * 0.88
            
        return {
            "predicted_yield_tons": round(float(prediction), 2),
            "baseline_variance": 0.12
        }
    except Exception as e:
        print(f"[Yield Prediction Model Error]: {e}")
        # Graceful fallback: Area * default multiplier for the crop
        crop_code = get_crop_code(payload.crop_name)
        multipliers = [4.0, 3.0, 15.0, 10.0, 12.0] # Tons/Hectare yield constants
        mult = multipliers[crop_code] if crop_code < len(multipliers) else 4.0
        fallback_yield = payload.calculated_area_hectares * mult
        return {
            "predicted_yield_tons": round(fallback_yield, 2),
            "baseline_variance": 0.15,
            "error_fallback": str(e)
        }

@router.post("/prices", dependencies=[Depends(verify_internal_token)])
async def predict_prices(payload: PriceRequest):
    try:
        # Load price forecaster Ridge model from pkl
        with open(settings.PRICE_MODEL_PATH, "rb") as f:
            model = pickle.load(f)
            
        crop_code = get_crop_code(payload.crop_name)
        
        # Forecast 30 days sequentially
        # Autoregressive sequence prediction
        forecast = []
        p_90 = payload.last_price_90_days
        p_60 = payload.last_price_60_days
        p_30 = payload.last_price_30_days
        
        for i in range(30):
            # Input features: [p_90, p_60, p_30, crop_code]
            features = np.array([[p_90, p_60, p_30, crop_code]])
            next_price = float(model.predict(features)[0])
            
            # Dynamic price bounds checking (avoid negative or extreme outputs)
            next_price = max(payload.last_price_30_days * 0.5, min(payload.last_price_30_days * 1.5, next_price))
            
            forecast.append(round(next_price, 2))
            
            # Shift sequence for next day prediction (autoregressive step)
            p_90 = p_60
            p_60 = p_30
            p_30 = next_price
            
        return {
            "crop_name": payload.crop_name,
            "forecasted_prices_inr": forecast
        }
    except Exception as e:
        print(f"[Price Forecaster Model Error]: {e}")
        # Standard fallback: generate price wave around current price
        base = payload.last_price_30_days
        forecast = [round(base + (np.sin(i / 5.0) * (base * 0.05)) + (np.random.randn() * 20), 2) for i in range(30)]
        return {
            "crop_name": payload.crop_name,
            "forecasted_prices_inr": forecast,
            "error_fallback": str(e)
        }
