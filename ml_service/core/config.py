import os

class Settings:
    PROJECT_NAME: str = "AgriOS ML Sidecar"
    VERSION: str = "1.0.0"
    
    # Paths for serialized models
    MODEL_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models_bin")
    DISEASE_MODEL_PATH: str = os.path.join(MODEL_DIR, "disease_classifier.h5")
    YIELD_MODEL_PATH: str = os.path.join(MODEL_DIR, "yield_regressor.pkl")
    PRICE_MODEL_PATH: str = os.path.join(MODEL_DIR, "price_forecaster.pkl")

    # Internal token for secure communication with Node.js backend
    INTERNAL_SECRET_TOKEN: str = os.getenv("ML_SIDECAR_TOKEN", "agrios_internal_secure_sidecar_token_123")

settings = Settings()