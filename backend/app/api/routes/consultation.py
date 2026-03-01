from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db import models, schemas
from app.api.deps import get_db_session, get_patient_user
from app.services import consultation_service

router = APIRouter(prefix="/api/consultation", tags=["Consultation"])

@router.post("", response_model=schemas.ConsultationResponse)
def create_consultation(
    consultation: schemas.ConsultationCreate,
    current_user: models.User = Depends(get_patient_user),
    db: Session = Depends(get_db_session),
):
    # 1️⃣ Save consultation
    result = consultation_service.create_consultation(
        db, current_user.id, consultation.dict()
    )

    structured = consultation.structured_data or {}

    # 2️⃣ Check if lab data exists
    if "serum_creatinine" in structured:

        # Get patient
        patient = db.query(models.PatientProfile).filter(
            models.PatientProfile.user_id == current_user.id
        ).first()

        if patient:

            from datetime import datetime

            features = {
                'age': (datetime.now() - patient.date_of_birth).days // 365,
                'sex': 0 if patient.sex == 'M' else 1,
                'serum_creatinine': structured.get('serum_creatinine', 0),
                'cystatin_c': structured.get('cystatin_c', 0),
                'blood_pressure_sys': structured.get('blood_pressure_sys', 0),
                'blood_pressure_dia': structured.get('blood_pressure_dia', 0),
                'blood_urea': structured.get('blood_urea', 0),
                'sodium': structured.get('sodium', 0),
                'potassium': structured.get('potassium', 0),
            }

            # 3️⃣ Run ML
            from app.services import prediction_service
            from app.services.clinical_service import ClinicalGuidanceService

            pred_dict, risk_level = prediction_service.generate_prediction(features)

            guidance = ClinicalGuidanceService.get_stage_guidance(
                pred_dict['ckd_stage'],
                pred_dict['egfr_predicted']
            )

            # 4️⃣ Save prediction
            prediction = models.Prediction(
                patient_id=patient.id,
                consultation_id=result.id,  # 🔥 Link to consultation
                input_features=features,
                egfr_predicted=pred_dict['egfr_predicted'],
                egfr_confidence=pred_dict['egfr_confidence'],
                ckd_stage=pred_dict['ckd_stage'],
                stage_confidence=pred_dict['stage_confidence'],
                risk_level=pred_dict['risk_level'],
                shap_values=pred_dict['shap_values'],
                top_contributing_features=pred_dict['top_contributing_features'],
                clinical_guidance=guidance['clinical_guidance'],
                recommendations=guidance['recommendations'],
                model_version="1.0",
            )

            db.add(prediction)
            db.commit()

    return schemas.ConsultationResponse.from_orm(result)

@router.get("", response_model=List[schemas.ConsultationResponse])
def list_consultations(
    current_user: models.User = Depends(get_patient_user),
    db: Session = Depends(get_db_session),
):
    items = consultation_service.list_consultations(db, current_user.id)
    return [schemas.ConsultationResponse.from_orm(i) for i in items]
