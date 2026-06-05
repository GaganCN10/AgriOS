import os
import sys
import numpy as np

# Ensure path includes root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml_service.core.config import settings
from ml_service.pipelines.image_preprocessing import preprocess_image
from ml_service.pipelines.text_tokenization import analyze_prompt_safety
import h5py
import pickle

def test_disease_classifier():
    print("[Test] Testing Disease Classifier H5 weights...")
    assert os.path.exists(settings.DISEASE_MODEL_PATH), "Disease classifier H5 file missing"
    
    # Read image bytes simulation
    dummy_bytes = b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
    tensor = preprocess_image(dummy_bytes)
    assert tensor.shape == (1, 224, 224, 3), "Tensor shape must be (1, 224, 224, 3)"
    
    with h5py.File(settings.DISEASE_MODEL_PATH, "r") as f:
        assert "dense/weights" in f, "H5 file missing dense group weights"
        assert "classes" in f, "H5 file missing classes array"
        meta_classes = f["classes"][:]
        class_labels = [c.decode('utf-8') for c in meta_classes]
        assert len(class_labels) == 4, "Must contain exactly 4 crop health classes"
        print(f" -> Found labels: {class_labels}")
    print("[Test] Disease Classifier check passed!")

def test_yield_regressor():
    print("[Test] Testing Yield Regressor PKL model...")
    assert os.path.exists(settings.YIELD_MODEL_PATH), "Yield regressor PKL file missing"
    
    with open(settings.YIELD_MODEL_PATH, "rb") as f:
        model = pickle.load(f)
        
    # Input vector: [hectares, n, p, k, ph, crop_code]
    dummy_input = np.array([[1.5, 45, 18, 24, 6.8, 0]])
    prediction = model.predict(dummy_input)
    assert len(prediction) == 1, "Regressor must yield a single numerical float outcome"
    print(f" -> Projected yield prediction: {prediction[0]:.2f} metric tons")
    print("[Test] Yield Regressor check passed!")

def test_price_forecaster():
    print("[Test] Testing Price Forecaster Ridge model...")
    assert os.path.exists(settings.PRICE_MODEL_PATH), "Price forecaster PKL file missing"
    
    with open(settings.PRICE_MODEL_PATH, "rb") as f:
        model = pickle.load(f)
        
    # Input vector: [p_90, p_60, p_30, crop_code]
    dummy_input = np.array([[4200, 4220, 4250, 0]])
    prediction = model.predict(dummy_input)
    assert len(prediction) == 1, "Price forecasting regressor must return single float projection"
    print(f" -> Next day price prediction: INR {prediction[0]:.2f}")
    print("[Test] Price Forecaster check passed!")

def test_safety_guardrails():
    print("[Test] Testing GenAI prompt safety guardrails...")
    # Safe prompt
    is_safe, warn = analyze_prompt_safety("How much nitrogen does rice require?")
    assert is_safe, "Valid prompt flagged as unsafe"
    
    # Hazardous mix prompt
    is_safe_bad, warn_bad = analyze_prompt_safety("Can I mix paraquat and glyphosate?")
    assert not is_safe_bad, "Unsafe chemical combination not flagged"
    print(f" -> Correctly flagged warning: '{warn_bad}'")
    print("[Test] Prompt safety check passed!")

if __name__ == "__main__":
    print("==================================================")
    print("           AgriOS ML Inference Test Suite")
    print("==================================================")
    
    # Check if models exist, if not call training
    if not os.path.exists(settings.DISEASE_MODEL_PATH):
        print("Model weight files missing. Generating models first...")
        from ml_service import train_dummy_models
        train_dummy_models.main()
        
    test_disease_classifier()
    test_yield_regressor()
    test_price_forecaster()
    test_safety_guardrails()
    print("==================================================")
    print("All ML Sidecar unit tests completed successfully!")
    print("==================================================")
