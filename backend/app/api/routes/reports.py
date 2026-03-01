from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse

from app.db import models, schemas
from app.api.deps import get_db_session, get_patient_user
from app.services import report_service

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("")
def list_reports(
    current_user: models.User = Depends(get_patient_user),
    db: Session = Depends(get_db_session),
):
    reports = report_service.list_reports(db, current_user.id)

    if not reports:
        return {
            "message": "No reports generated yet.",
            "reports": []
        }

    return {
        "message": "Reports fetched successfully.",
        "reports": reports
    }

@router.get("/{report_id}")
def download_report(
    report_id: int,
    current_user: models.User = Depends(get_patient_user),  # 🔥 ADD THIS
    db: Session = Depends(get_db_session),
):
    report = report_service.get_report(db, report_id)

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # 🔥 Ownership check
    if report.prediction.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not report.pdf_path:
        raise HTTPException(status_code=404, detail="No PDF available")

    return FileResponse(
        path=report.pdf_path,
        filename=f"ckd_report_{report.id}.pdf",
        media_type="application/pdf"
    )