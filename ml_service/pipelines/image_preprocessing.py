import numpy as np

def preprocess_image(image_bytes: bytes, target_size=(224, 224)) -> np.ndarray:
    """
    Simulates tensor loading and image normalization:
    Converts raw image bytes to (1, 224, 224, 3) normalized float array.
    """
    try:
        # Programmatic parsing: Convert bytes to array
        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        
        # Simulated decoding & resizing
        # We construct a reproducible tensor shape (224, 224, 3) representing the image
        seed_value = int(np.sum(arr) % 1000)
        np.random.seed(seed_value)
        
        # Generate raw mock image grid based on magic seed
        img_grid = np.random.randint(0, 255, size=(target_size[0], target_size[1], 3), dtype=np.uint8)
        
        # Float normalization (divide by 255.0 to map pixels between 0.0 and 1.0)
        normalized_img = img_grid.astype(np.float32) / 255.0
        
        # Expand dimensions to create batch size: (1, 224, 224, 3)
        batched_tensor = np.expand_dims(normalized_img, axis=0)
        return batched_tensor
    except Exception as e:
        print(f"[Preprocessing Error]: {e}")
        # Default fallback tensor
        return np.zeros((1, target_size[0], target_size[1], 3), dtype=np.float32)
