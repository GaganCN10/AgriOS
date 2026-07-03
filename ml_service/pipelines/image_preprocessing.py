from io import BytesIO

import numpy as np
from PIL import Image

def preprocess_image(image_bytes: bytes, target_size=(224, 224)) -> np.ndarray:
    """
    Decode an uploaded image, resize it to the model input shape,
    normalize pixel values, and return a batched tensor.
    """
    try:
        image = Image.open(BytesIO(image_bytes))
        image = image.convert("RGB")
        image = image.resize(target_size, Image.Resampling.BILINEAR)

        image_array = np.asarray(image, dtype=np.float32) / 255.0
        return np.expand_dims(image_array, axis=0)
    except Exception as e:
        print(f"[Preprocessing Error]: {e}")
        return np.zeros((1, target_size[0], target_size[1], 3), dtype=np.float32)
