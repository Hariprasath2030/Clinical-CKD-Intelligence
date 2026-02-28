"""Business logic for report generation and retrieval"""
from sqlalchemy.orm import Session
from ..db import models


def list_reports(db: Session, user_id: int):
    return db.query(models.Report).filter(models.Report.generated_by_user_id == user_id).all()


def get_report(db: Session, report_id: int):
    return db.query(models.Report).filter(models.Report.id == report_id).first()
