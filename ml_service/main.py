import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ml_service.endpoints import vision, prediction, advisor
from ml_service.core.config import settings

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

@app.get("/health")
def health_check():
    # Verify that model weight files are present on the filesystem
    disease_exists = os.path.exists(settings.DISEASE_MODEL_PATH)
    yield_exists = os.path.exists(settings.YIELD_MODEL_PATH)
    price_exists = os.path.exists(settings.PRICE_MODEL_PATH)
    
    return {
        "status": "online",
        "models": {
            "disease_classifier": "loaded" if disease_exists else "missing",
            "yield_regressor": "loaded" if yield_exists else "missing",
            "price_forecaster": "loaded" if price_exists else "missing"
        }
    }

if __name__ == "__main__":
    import uvicorn
    # Start FastAPI server on port 8000
    uvicorn.run("ml_service.main:app", host="127.0.0.1", port=8000, reload=True)
