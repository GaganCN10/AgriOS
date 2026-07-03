import pickle

import h5py

from ml_service.core.config import settings


class ModelRegistry:
    def __init__(self):
        self.disease_weights = None
        self.disease_bias = None
        self.disease_classes = None
        self.yield_model = None
        self.price_model = None

    def load(self):
        with h5py.File(settings.DISEASE_MODEL_PATH, "r") as file_handle:
            self.disease_weights = file_handle["dense/weights"][:]
            self.disease_bias = file_handle["dense/bias"][:]
            self.disease_classes = [label.decode("utf-8") for label in file_handle["classes"][:]]

        with open(settings.YIELD_MODEL_PATH, "rb") as file_handle:
            self.yield_model = pickle.load(file_handle)

        with open(settings.PRICE_MODEL_PATH, "rb") as file_handle:
            self.price_model = pickle.load(file_handle)

    @property
    def is_loaded(self):
        return all([
            self.disease_weights is not None,
            self.disease_bias is not None,
            self.disease_classes is not None,
            self.yield_model is not None,
            self.price_model is not None,
        ])


model_registry = ModelRegistry()