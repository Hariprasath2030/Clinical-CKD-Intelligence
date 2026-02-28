"""
Prediction service layer that interacts with the ML package.
"""
from typing import Dict, Any, Tuple

from ..ml import get_ml_service

ml_service = get_ml_service()


def generate_prediction(features: Dict[str, float]) -> Tuple[Dict[str, Any], str]:
    """Run the full prediction pipeline and return results + guidance."""
    egfr, egfr_confidence = ml_service.predict_egfr(features)
    ckd_stage = ml_service.predict_ckd_stage(egfr)
    stage_confidence = ml_service.calculate_stage_confidence(egfr, ckd_stage)
    risk_level = ml_service.classify_risk_level(egfr, ckd_stage)

    shap_dict = ml_service.get_shap_values(features)
    top_features = ml_service.get_top_features(shap_dict, top_n=5)

    return (
        {
            "egfr_predicted": float(egfr),
            "egfr_confidence": float(egfr_confidence),
            "ckd_stage": ckd_stage,
            "stage_confidence": float(stage_confidence),
            "risk_level": risk_level,
            "shap_values": shap_dict,
            "top_contributing_features": top_features,
        },
        risk_level,
    )
