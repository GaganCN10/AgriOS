import os

class Settings:
    PROJECT_NAME: str = "AgriOS ML Sidecar"
    VERSION: str = "1.0.0"
    
    # Model binary paths
    DISEASE_MODEL_PATH: str = os.getenv("DISEASE_MODEL_PATH", "ml_service/models_bin/disease_classifier.h5")
    YIELD_MODEL_PATH: str = os.getenv("YIELD_MODEL_PATH", "ml_service/models_bin/yield_regressor.pkl")
    PRICE_MODEL_PATH: str = os.getenv("PRICE_MODEL_PATH", "ml_service/models_bin/price_forecaster.pkl")
    
    # Internal authorization secret
    INTERNAL_TOKEN: str = os.getenv("ML_SIDECAR_TOKEN", "agrios_internal_secure_sidecar_token_123")

settings = Settings()
