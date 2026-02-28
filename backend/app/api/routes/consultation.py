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
    result = consultation_service.create_consultation(
        db, current_user.id, consultation.dict()
    )
    return schemas.ConsultationResponse.from_orm(result)

@router.get("", response_model=List[schemas.ConsultationResponse])
def list_consultations(
    current_user: models.User = Depends(get_patient_user),
    db: Session = Depends(get_db_session),
):
    items = consultation_service.list_consultations(db, current_user.id)
    return [schemas.ConsultationResponse.from_orm(i) for i in items]
