import os
import pickle
import h5py
import numpy as np
from .config import settings

CROP_CODE_MAP = {
    "Rice": 0,
    "Wheat": 1,
    "Tomato": 2,
    "Onion": 3,
    "Potato": 4,
}

REMEDIATION_PROTOCOLS = {
    "Healthy": "No disease detected. Continue standard irrigation and balanced NPK monitoring.",
    "Leaf Blast": "Apply Tricyclazole 75 WP at 0.6 g/L. Reduce nitrogen top-dressing and improve field drainage.",
    "Brown Spot": "Spray Propiconazole 25 EC at 1 ml/L. Remove heavily infected leaves and avoid overhead irrigation.",
    "Sheath Rot": "Apply Validamycin 3 L at 2.5 ml/L. Maintain proper plant spacing and avoid water stagnation.",
}


class ModelRegistry:
    def __init__(self):
        self.disease_weights = None
        self.disease_bias = None
        self.disease_classes = ["Healthy", "Leaf Blast", "Brown Spot", "Sheath Rot"]
        self.yield_model = None
        self.price_model = None

    def _load_disease_classifier(self):
        if not os.path.exists(settings.DISEASE_MODEL_PATH):
            print(f"Disease classifier not found at {settings.DISEASE_MODEL_PATH}. Using initialized weights.")
            self.disease_weights = np.random.default_rng(42).random((100, len(self.disease_classes)))
            self.disease_bias = np.zeros(len(self.disease_classes))
            return

        with h5py.File(settings.DISEASE_MODEL_PATH, "r") as f:
            if "dense/weights" in f:
                self.disease_weights = f["dense/weights"][()]
                self.disease_bias = f["dense/bias"][()]
            elif "dense_weights" in f:
                self.disease_weights = f["dense_weights"][()]
                self.disease_bias = f["dense_bias"][()]
            else:
                raise KeyError("H5 file missing dense layer weights")

            if "classes" in f:
                meta_classes = [label.decode("utf-8") for label in f["classes"][:]]
                if meta_classes:
                    self.disease_classes = meta_classes

        print(f"Loaded disease classifier from {settings.DISEASE_MODEL_PATH}")

    def _load_yield_model(self):
        if os.path.exists(settings.YIELD_MODEL_PATH):
            with open(settings.YIELD_MODEL_PATH, "rb") as handle:
                self.yield_model = pickle.load(handle)
            print(f"Loaded yield regressor from {settings.YIELD_MODEL_PATH}")
            return

        class FallbackYieldModel:
            def predict(self, features):
                return np.array([features[0, 0] * 4.0])

        self.yield_model = FallbackYieldModel()
        print(f"Yield regressor not found at {settings.YIELD_MODEL_PATH}. Using fallback model.")

    def _load_price_model(self):
        if os.path.exists(settings.PRICE_MODEL_PATH):
            with open(settings.PRICE_MODEL_PATH, "rb") as handle:
                self.price_model = pickle.load(handle)
            print(f"Loaded price forecaster from {settings.PRICE_MODEL_PATH}")
            return

        class FallbackPriceModel:
            def predict(self, features):
                return np.array([features[0, 2] * 1.01])

        self.price_model = FallbackPriceModel()
        print(f"Price forecaster not found at {settings.PRICE_MODEL_PATH}. Using fallback model.")

    def load(self):
        print("Loading ML models into memory...")
        try:
            self._load_disease_classifier()
            self._load_yield_model()
            self._load_price_model()
            print("All ML models loaded.")
        except Exception as exc:
            print(f"Error loading ML models: {exc}")

    def classify_image(self, tensor: np.ndarray):
        flattened = tensor.reshape(1, -1)
        if flattened.shape[1] < self.disease_weights.shape[0]:
            padded = np.zeros((1, self.disease_weights.shape[0]), dtype=np.float32)
            padded[0, : flattened.shape[1]] = flattened[0]
            flattened = padded
        else:
            flattened = flattened[:, : self.disease_weights.shape[0]]

        logits = flattened @ self.disease_weights + self.disease_bias
        exp_logits = np.exp(logits - np.max(logits, axis=1, keepdims=True))
        probabilities = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)
        class_index = int(np.argmax(probabilities, axis=1)[0])
        confidence = float(probabilities[0, class_index])
        disease = self.disease_classes[class_index]
        return disease, confidence, REMEDIATION_PROTOCOLS.get(disease, "Consult local agronomist for treatment guidance.")

    def predict_yield(self, area, soil_profile, crop_name):
        crop_code = CROP_CODE_MAP.get(crop_name, 0)
        features = np.array([[
            float(area),
            float(soil_profile.get("nitrogen_level", 0)),
            float(soil_profile.get("phosphorus_level", 0)),
            float(soil_profile.get("potassium_level", 0)),
            float(soil_profile.get("ph_level", 7.0)),
            float(crop_code),
        ]])
        prediction = float(self.yield_model.predict(features)[0])
        variance = float(min(0.25, max(0.08, 0.12 + (prediction * 0.01))))
        return prediction, variance

    def forecast_prices(self, crop_name, p90, p60, p30):
        crop_code = CROP_CODE_MAP.get(crop_name, 0)
        base_features = np.array([[float(p90 or p30), float(p60 or p30), float(p30), float(crop_code)]])

        forecasted_prices = []
        rolling = base_features.copy()
        for _ in range(30):
            next_price = float(self.price_model.predict(rolling)[0])
            forecasted_prices.append(round(next_price, 2))
            rolling = np.array([[rolling[0, 1], rolling[0, 2], next_price, crop_code]])

        forecast_7d = forecasted_prices[6] if len(forecasted_prices) >= 7 else forecasted_prices[-1]
        forecast_30d = forecasted_prices[-1]
        delta = forecast_30d - float(p30 or forecast_7d)
        if delta > 50:
            trend = "BULLISH"
        elif delta < -50:
            trend = "BEARISH"
        else:
            trend = "STABLE"

        return {
            "forecasted_prices_inr": forecasted_prices,
            "forecast_7d": forecast_7d,
            "forecast_30d": forecast_30d,
            "estimated_price_trend": trend,
            "confidence_low": round(min(forecasted_prices) * 0.95, 2),
            "confidence_high": round(max(forecasted_prices) * 1.05, 2),
            "advisory": (
                f"{crop_name} prices are projected to remain {trend.lower()} over the next 30 days. "
                "Use this forecast to time FPO lot listing and procurement negotiations."
            ),
        }


model_registry = ModelRegistry()
