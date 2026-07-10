import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from endpoints import vision, prediction, advisor
from core.config import settings
from core.model_registry import model_registry

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Independent Python Machine Learning sidecar platform for AgriOS",
    version=settings.VERSION
)

# Enable CORS for cross-communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount endpoints routers
app.include_router(vision.router)
app.include_router(prediction.router)
app.include_router(advisor.router)


@app.on_event("startup")
def load_models_into_memory():
    model_registry.load()

@app.get("/health")
def health_check():
    # Verify that model weight files are present and models are resident in memory
    disease_exists = os.path.exists(settings.DISEASE_MODEL_PATH)
    yield_exists = os.path.exists(settings.YIELD_MODEL_PATH)
    price_exists = os.path.exists(settings.PRICE_MODEL_PATH)
    
    return {
        "status": "online",
        "models": {
            "disease_classifier": "loaded" if disease_exists and model_registry.disease_weights is not None else "missing",
            "yield_regressor": "loaded" if yield_exists and model_registry.yield_model is not None else "missing",
            "price_forecaster": "loaded" if price_exists and model_registry.price_model is not None else "missing"
        }
    }

if __name__ == "__main__":
    import uvicorn
    # Start FastAPI server on port 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
