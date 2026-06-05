import numpy as np

def normalize_weather_data(avg_temp: float, rainfall_mm: float, wind_speed: float) -> dict:
    """
    Normalizes temperature and precipitation ranges to establish climatic stability index.
    """
    # Ideal temp range: 20-30 degrees
    temp_score = 1.0 - min(1.0, abs(avg_temp - 25.0) / 15.0)
    
    # Ideal rainfall for general crops: 500-1500mm annually (approx 80-150mm during cycle stages)
    rainfall_score = 1.0 - min(1.0, abs(rainfall_mm - 120.0) / 100.0)
    
    wind_score = 1.0 - min(1.0, wind_speed / 45.0) # threshold wind storm
    
    climate_index = float((temp_score * 0.4) + (rainfall_score * 0.4) + (wind_score * 0.2))
    
    return {
        "temp_score": temp_score,
        "rainfall_score": rainfall_score,
        "climate_index": max(0.1, min(1.0, climate_index))
    }
