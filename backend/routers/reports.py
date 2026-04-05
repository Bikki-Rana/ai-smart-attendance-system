"""Reports Router: analytics, exports (CSV/Excel)"""
import os
from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from dependencies import get_current_user, require_admin
from utils.export_utils import export_to_csv, export_to_excel
import models

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/export/csv")
def export_csv(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Students can only export their own data
    if current_user.role == "student":
        student_id = current_user.id

    query = db.query(models.AttendanceRecord)
    if student_id:
        query = query.filter(models.AttendanceRecord.student_id == student_id)
    records = query.all()

    data = [{
        "Student Name": r.student.name if r.student else "",
        "Student ID": r.student.student_id if r.student else "",
        "Subject": r.subject.name if r.subject else "",
        "Date": r.date,
        "Time": r.timestamp.strftime("%H:%M:%S") if r.timestamp else "",
        "Status": r.status,
        "Liveness Passed": "Yes" if r.liveness_passed else "No",
        "Confidence %": f"{r.confidence:.1f}" if r.confidence else "",
    } for r in records]

    suffix = f"_student_{student_id}" if student_id else "_all"
    filepath = export_to_csv(data, f"attendance{suffix}.csv")
    return FileResponse(filepath, filename=os.path.basename(filepath), media_type="text/csv")


@router.get("/export/excel")
def export_excel(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role == "student":
        student_id = current_user.id

    query = db.query(models.AttendanceRecord)
    if student_id:
        query = query.filter(models.AttendanceRecord.student_id == student_id)
    records = query.all()

    data = [{
        "Student Name": r.student.name if r.student else "",
        "Student ID": r.student.student_id if r.student else "",
        "Subject": r.subject.name if r.subject else "",
        "Date": r.date,
        "Time": r.timestamp.strftime("%H:%M:%S") if r.timestamp else "",
        "Status": r.status,
        "Liveness Passed": "Yes" if r.liveness_passed else "No",
        "Confidence %": f"{r.confidence:.1f}" if r.confidence else "",
    } for r in records]

    suffix = f"_student_{student_id}" if student_id else "_all"
    title = f"Student {student_id} Report" if student_id else "Full System Report"
    filepath = export_to_excel(data, f"attendance{suffix}.xlsx", title)
    return FileResponse(
        filepath,
        filename=os.path.basename(filepath),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/heatmap/{student_id}")
def attendance_heatmap(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return per-day attendance data for heatmap visualization."""
    if current_user.role == "student" and current_user.id != student_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not authorized")

    records = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id == student_id,
        models.AttendanceRecord.status == "present",
    ).all()

    heatmap = {}
    for r in records:
        heatmap[r.date] = heatmap.get(r.date, 0) + 1

    return [{"date": k, "count": v} for k, v in sorted(heatmap.items())]


@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
    limit: int = Query(50, le=200),
):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(limit).all()
    return [{
        "id": l.id,
        "user_id": l.user_id,
        "action": l.action,
        "details": l.details,
        "timestamp": l.timestamp.isoformat() if l.timestamp else None,
    } for l in logs]
