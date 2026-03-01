from sqlalchemy.orm import Session
from ..db import models
from datetime import datetime
import os
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch

def list_reports(db: Session, user_id: int):
    return db.query(models.Report).filter(models.Report.generated_by_user_id == user_id).all()


def get_report(db: Session, report_id: int):
    return db.query(models.Report).filter(models.Report.id == report_id).first()


def generate_report(db: Session, prediction: models.Prediction):
    """
    Auto-generate AI clinical report from prediction
    """

    title = f"CKD Clinical Report - Stage {prediction.ckd_stage}"

    summary = (
        f"The patient is classified under CKD Stage {prediction.ckd_stage} "
        f"with a predicted eGFR of {prediction.egfr_predicted:.2f} mL/min/1.73m²."
    )

    detailed_analysis = (
        f"Model confidence: {prediction.egfr_confidence:.2f}\n"
        f"Stage confidence: {prediction.stage_confidence:.2f}\n"
        f"Risk level: {prediction.risk_level}\n\n"
        f"Top contributing features:\n"
    )

    for feature in prediction.top_contributing_features:
        detailed_analysis += f"- {feature['feature']}: {feature['importance']:.4f}\n"

    recommendations = "\n".join(prediction.recommendations)

    # 🔥 Create reports folder if it doesn't exist
    os.makedirs("reports", exist_ok=True)
    pdf_path = f"reports/report_{prediction.id}.pdf"

    # 🔥 Build PDF
    doc = SimpleDocTemplate(pdf_path)
    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph(title, styles["Heading1"]))
    elements.append(Spacer(1, 0.2 * inch))

    elements.append(Paragraph(summary, styles["Normal"]))
    elements.append(Spacer(1, 0.2 * inch))

    elements.append(Paragraph("Clinical Analysis:", styles["Heading2"]))
    elements.append(Paragraph(detailed_analysis.replace("\n", "<br/>"), styles["Normal"]))
    elements.append(Spacer(1, 0.2 * inch))

    elements.append(Paragraph("Recommendations:", styles["Heading2"]))
    elements.append(Paragraph(recommendations.replace("\n", "<br/>"), styles["Normal"]))

    doc.build(elements)

    # 🔥 Save to DB with pdf_path
    report = models.Report(
        prediction_id=prediction.id,
        generated_by_user_id=prediction.patient.user_id,
        title=title,
        summary=summary,
        detailed_analysis=detailed_analysis,
        recommendations=recommendations,
        pdf_path=pdf_path,
        created_at=datetime.utcnow()
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report