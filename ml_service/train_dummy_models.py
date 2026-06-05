import os
import pickle
import h5py
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge

def main():
    print("[ML Bootstrap] Initializing dummy model training and serialization...")
    
    # Create models directory
    os.makedirs("ml_service/models_bin", exist_ok=True)
    
    # 1. Create disease_classifier.h5 using h5py
    h5_path = "ml_service/models_bin/disease_classifier.h5"
    with h5py.File(h5_path, "w") as f:
        # Create groups to look like a standard convolutional model weights structure
        conv_g = f.create_group("conv2d")
        conv_g.create_dataset("kernel", data=np.random.randn(3, 3, 3, 16).astype(np.float32))
        conv_g.create_dataset("bias", data=np.random.randn(16).astype(np.float32))
        
        dense_g = f.create_group("dense")
        dense_g.create_dataset("weights", data=np.random.randn(100, 4).astype(np.float32))
        dense_g.create_dataset("bias", data=np.random.randn(4).astype(np.float32))
        
        # Meta classes
        f.create_dataset("classes", data=[b'Healthy', b'Leaf Blast', b'Brown Spot', b'Sheath Rot'])
        
    print(f"[ML Bootstrap] Saved Image Classification model weights: {h5_path}")
    
    # 2. Train and save yield_regressor.pkl (RandomForestRegressor)
    # Features: [hectares, n_level, p_level, k_level, ph_level, crop_code]
    # Crop Codes: Rice: 0, Wheat: 1, Tomato: 2, Onion: 3, Potato: 4
    X_yield = np.array([
        [1.0, 45, 18, 24, 6.8, 0],
        [2.5, 50, 20, 28, 6.5, 0],
        [1.5, 30, 12, 18, 5.8, 1],
        [4.0, 60, 25, 30, 7.2, 0],
        [0.8, 20, 10, 15, 6.0, 1],
        [3.0, 55, 22, 26, 6.7, 2],
        [2.0, 48, 19, 23, 6.6, 3],
        [1.2, 40, 16, 20, 6.4, 4]
    ])
    # Target yield in metric tons
    y_yield = np.array([4.2, 11.2, 3.8, 18.5, 1.8, 15.0, 8.5, 12.0])
    
    yield_model = RandomForestRegressor(n_estimators=10, random_state=42)
    yield_model.fit(X_yield, y_yield)
    
    yield_path = "ml_service/models_bin/yield_regressor.pkl"
    with open(yield_path, "wb") as f:
        pickle.dump(yield_model, f)
    print(f"[ML Bootstrap] Saved Yield Regression model: {yield_path}")
    
    # 3. Train and save price_forecaster.pkl (Ridge regression sequence model)
    # Features: [last_price_90_days, last_price_60_days, last_price_30_days, crop_code]
    X_price = np.array([
        [4000, 4100, 4200, 0], # Rice
        [2500, 2550, 2600, 1], # Wheat
        [1600, 1700, 1800, 2], # Tomato
        [2000, 2100, 2200, 3], # Onion
        [1400, 1450, 1500, 4], # Potato
        [4300, 4250, 4180, 0],
        [2580, 2600, 2620, 1]
    ])
    # Next day target price
    y_price = np.array([4250, 2620, 1820, 2250, 1520, 4150, 2630])
    
    price_model = Ridge()
    price_model.fit(X_price, y_price)
    
    price_path = "ml_service/models_bin/price_forecaster.pkl"
    with open(price_path, "wb") as f:
        pickle.dump(price_model, f)
    print(f"[ML Bootstrap] Saved Price Forecaster model: {price_path}")
    print("[ML Bootstrap] All models bootstrapped successfully!")

if __name__ == "__main__":
    main()
