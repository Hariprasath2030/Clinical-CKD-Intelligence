from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse

from app.db import models, schemas
from app.api.deps import get_db_session, get_patient_user
from app.services import report_service

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("", response_model=list[schemas.ReportResponse])
def list_reports(
    current_user: models.User = Depends(get_patient_user),
    db: Session = Depends(get_db_session),
):
    reports = report_service.list_reports(db, current_user.id)
    return [schemas.ReportResponse.from_orm(r) for r in reports]

@router.get("/{report_id}")
def download_report(
    report_id: int,
    db: Session = Depends(get_db_session),
):
    report = report_service.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if not report.pdf_path:
        raise HTTPException(status_code=404, detail="No PDF available")
    return FileResponse(report.pdf_path, filename="report.pdf")
