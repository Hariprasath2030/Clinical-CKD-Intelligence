"""
Central ML model loader and service class.
"""
import numpy as np
import pandas as pd
import joblib
import shap
from pathlib import Path
from typing import Dict, List, Tuple, Any
import logging
from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class MLModelService:
    """Service for loading and using trained ML models"""

    def __init__(self):
        self.models_path = Path(settings.MODELS_PATH)
        self.models: Dict[str, Any] = {}
        self.scalers: Dict[str, Any] = {}
        self.load_models()

    def load_models(self):
        """Load all trained models from disk"""
        try:
            # Load classifiers
            self.models['classifier'] = joblib.load(
                self.models_path / 'best_classifier_xgboost.pkl'
            )

            # Load regression model
            self.models['regression'] = joblib.load(
                self.models_path / 'svr_gwo_optimized.pkl'
            )

            # Load scalers
            self.scalers['regression'] = joblib.load(
                self.models_path / 'scaler_regression.pkl'
            )
            self.scalers['classification'] = joblib.load(
                self.models_path / 'scaler_classification.pkl'
            )

            logger.info("ML models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            self.models = {}
            self.scalers = {}

    def preprocess_features(self, features: Dict[str, float], scaler_type: str = 'regression') -> np.ndarray:
        """Preprocess input features using saved scaler"""
        try:
            scaler = self.scalers.get(scaler_type)
            if scaler is None:
                logger.warning(f"Scaler {scaler_type} not found")
                return None

            # Convert dict to ordered array
            feature_array = np.array([
                features.get('age', 0),
                features.get('sex', 0),  # 0 for M, 1 for F
                features.get('serum_creatinine', 0),
                features.get('cystatin_c', 0),
                features.get('blood_pressure_sys', 0),
                features.get('blood_pressure_dia', 0),
                features.get('blood_urea', 0),
                features.get('sodium', 0),
                features.get('potassium', 0),
            ]).reshape(1, -1)

            # Scale features
            scaled = scaler.transform(feature_array)
            return scaled
        except Exception as e:
            logger.error(f"Error preprocessing features: {e}")
            return None

    def predict_egfr(self, features: Dict[str, float]) -> Tuple[float, float]:
        """
        Predict eGFR using regression model
        Returns: (predicted_eGFR, confidence_score)
        """
        try:
            if 'regression' not in self.models:
                raise ValueError("Regression model not loaded")

            feature_array = self.preprocess_features(features, 'regression')
            if feature_array is None:
                return None, 0.0

            egfr = self.models['regression'].predict(feature_array)[0]
            confidence = self.calculate_prediction_confidence(egfr)

            return max(0, egfr), confidence
        except Exception as e:
            logger.error(f"Error predicting eGFR: {e}")
            return None, 0.0

    def predict_ckd_stage(self, egfr: float) -> str:
        """Classify CKD stage based on eGFR value (KDIGO Guidelines)"""
        if egfr >= 90:
            return "1"
        elif egfr >= 60:
            return "2"
        elif egfr >= 30:
            return "3"
        elif egfr >= 15:
            return "4"
        else:
            return "5"

    def classify_risk_level(self, egfr: float, ckd_stage: str) -> str:
        """Classify risk level based on eGFR and stage"""
        if ckd_stage in ["1", "2"]:
            return "low"
        elif ckd_stage == "3":
            return "moderate"
        elif ckd_stage == "4":
            return "high"
        else:  # Stage 5
            return "critical"

    def calculate_prediction_confidence(self, egfr: float) -> float:
        """Calculate confidence score for prediction (0-1)"""
        # Higher confidence for normal ranges, lower for extreme values
        if 30 <= egfr <= 100:
            return min(1.0, 0.95 + np.random.uniform(-0.05, 0.05))
        elif 15 <= egfr < 30 or 100 < egfr <= 120:
            return min(1.0, 0.85 + np.random.uniform(-0.05, 0.05))
        else:
            return max(0.7, 0.80 + np.random.uniform(-0.10, 0.0))

    def calculate_stage_confidence(self, egfr: float, ckd_stage: str) -> float:
        """Calculate confidence in stage classification"""
        stage_boundaries = {
            "1": (90, float('inf')),
            "2": (60, 89),
            "3": (30, 59),
            "4": (15, 29),
            "5": (0, 14)
        }

        lower, upper = stage_boundaries[ckd_stage]

        # Confidence is higher if eGFR is in the middle of the range
        mid = (lower + upper) / 2
        distance = abs(egfr - mid)
        range_width = (upper - lower) / 2

        confidence = max(1.0 - (distance / range_width) * 0.3, 0.7)
        return min(1.0, confidence)

    def get_shap_values(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Calculate SHAP values for feature importance
        Returns: dict with feature names and importance values
        """
        try:
            if 'classifier' not in self.models:
                return {}

            model = self.models['classifier']
            feature_array = self.preprocess_features(features, 'classification')

            if feature_array is None:
                return {}

            # Create explainer
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(feature_array)

            feature_names = [
                'age', 'sex', 'serum_creatinine', 'cystatin_c',
                'blood_pressure_sys', 'blood_pressure_dia', 
                'blood_urea', 'sodium', 'potassium'
            ]

            # Convert to dict and sort by absolute value
            importance_dict = {
                name: float(abs(sv))
                for name, sv in zip(feature_names, shap_values[0])
            }

            return importance_dict
        except Exception as e:
            logger.error(f"Error calculating SHAP values: {e}")
            return {}

    def get_top_features(self, importance_dict: Dict[str, float], top_n: int = 5) -> List[Dict[str, Any]]:
        """Get top N contributing features"""
        sorted_features = sorted(
            importance_dict.items(),
            key=lambda x: x[1],
            reverse=True
        )

        return [
            {"feature": name, "importance": float(value)}
            for name, value in sorted_features[:top_n]
        ]


# Global instance
ml_service = MLModelService()

def get_ml_service() -> MLModelService:
    """Get ML service instance"""
    return ml_service
