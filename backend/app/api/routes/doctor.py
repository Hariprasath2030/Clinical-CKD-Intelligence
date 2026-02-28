from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import models
from app.api.deps import get_db_session, get_doctor_user

router = APIRouter(prefix="/api/doctor", tags=["Doctor"])

@router.get("/patients")
def get_assigned_patients(
    current_user: models.User = Depends(get_doctor_user),
    db: Session = Depends(get_db_session),
):
    patients = current_user.doctor_patients
    patient_list = []
    for patient in patients:
        latest_pred = db.query(models.Prediction).filter(
            models.Prediction.patient_id == patient.id
        ).order_by(models.Prediction.created_at.desc()).first()
        patient_list.append({
            "id": patient.id,
            "full_name": patient.user.full_name,
            "latest_ckd_stage": latest_pred.ckd_stage if latest_pred else None,
            "latest_egfr": latest_pred.egfr_predicted if latest_pred else None,
            "latest_test_date": latest_pred.created_at if latest_pred else None,
            "risk_level": latest_pred.risk_level if latest_pred else None,
        })
    return patient_list
