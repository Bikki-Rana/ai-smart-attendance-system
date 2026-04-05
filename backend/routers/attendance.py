"""Attendance Router: mark attendance via face, get records"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
from database import get_db
from dependencies import get_current_user, require_admin
from ai.face_engine import identify_face
from ai.liveness import verify_liveness
from utils.timetable_parser import get_current_class
import models
import schemas

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/mark", response_model=schemas.AttendanceMarkResponse)
async def mark_attendance(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Mark attendance via face recognition + liveness check.
    Payload: { "frames": [base64_img, ...], "snapshot": base64_img }
    """
    frames = payload.get("frames", [])
    snapshot = payload.get("snapshot", "")

    if not snapshot and not frames:
        raise HTTPException(status_code=400, detail="No image data provided")

    # Step 1: Liveness check
    liveness_frames = frames if frames else [snapshot]
    liveness_passed, liveness_msg = verify_liveness(liveness_frames)
    if not liveness_passed:
        return schemas.AttendanceMarkResponse(
            success=False,
            message=f"Liveness check failed: {liveness_msg}"
        )

    # Step 2: Face recognition
    image_to_check = snapshot if snapshot else (frames[-1] if frames else "")
    matched_user_id, confidence = identify_face(image_to_check)

    if matched_user_id is None:
        return schemas.AttendanceMarkResponse(
            success=False,
            message=f"Face not recognized. Confidence: {confidence:.1f}%. Please register your face first.",
        )

    # Step 3: Verify matched user
    student = db.query(models.User).filter(models.User.id == matched_user_id).first()
    if not student or student.role != "student":
        return schemas.AttendanceMarkResponse(
            success=False, message="Recognized user is not a student"
        )

    # Step 4: Get current class from timetable
    current_class = get_current_class()
    if not current_class["is_ongoing"]:
        return schemas.AttendanceMarkResponse(
            success=False,
            message="No class is currently scheduled. Please check your timetable."
        )

    # Step 5: Find or create subject in DB
    subject = db.query(models.Subject).filter(
        models.Subject.code == current_class["subject_code"]
    ).first()
    if not subject:
        subject = models.Subject(
            name=current_class["subject_name"],
            code=current_class["subject_code"],
            teacher_name=current_class["teacher_name"],
            teacher_code=current_class["teacher_code"],
        )
        db.add(subject)
        db.commit()
        db.refresh(subject)

    # Step 6: Check for duplicate attendance today
    today_str = date.today().isoformat()
    existing = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id == matched_user_id,
        models.AttendanceRecord.subject_id == subject.id,
        models.AttendanceRecord.date == today_str,
    ).first()

    if existing:
        return schemas.AttendanceMarkResponse(
            success=False,
            message=f"Attendance already marked for {subject.name} today.",
            student_name=student.name,
            subject_name=subject.name,
        )

    # Step 7: Record attendance
    record = models.AttendanceRecord(
        student_id=matched_user_id,
        subject_id=subject.id,
        date=today_str,
        method="face_recognition",
        liveness_passed=liveness_passed,
        confidence=confidence,
        status="present",
    )
    db.add(record)
    db.commit()

    # Step 8: Check attendance percentage and generate alert if needed
    _check_and_alert(student, db)

    return schemas.AttendanceMarkResponse(
        success=True,
        message=f"✅ Attendance marked successfully!",
        student_name=student.name,
        subject_name=subject.name,
        confidence=confidence,
    )


def _check_and_alert(student: models.User, db: Session):
    """Check if student attendance is below 60% and create alert."""
    total = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id == student.id
    ).count()
    attended = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id == student.id,
        models.AttendanceRecord.status == "present",
    ).count()

    if total > 0:
        pct = (attended / total) * 100
        if pct < 60:
            # Check if alert already exists recently
            existing_alert = db.query(models.Alert).filter(
                models.Alert.user_id == student.id,
                models.Alert.alert_type == "danger",
                models.Alert.is_read == False,
            ).first()
            if not existing_alert:
                alert = models.Alert(
                    user_id=student.id,
                    title="⚠️ Low Attendance Warning",
                    message=f"Your overall attendance is {pct:.1f}%, which is below the required 60%. Please attend classes regularly.",
                    alert_type="danger",
                )
                db.add(alert)
                db.commit()


@router.get("/", response_model=List[schemas.AttendanceOut])
def get_attendance(
    student_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.AttendanceRecord)

    # Students can only see their own records
    if current_user.role == "student":
        query = query.filter(models.AttendanceRecord.student_id == current_user.id)
    elif student_id:
        query = query.filter(models.AttendanceRecord.student_id == student_id)

    if subject_id:
        query = query.filter(models.AttendanceRecord.subject_id == subject_id)
    if date_from:
        query = query.filter(models.AttendanceRecord.date >= date_from)
    if date_to:
        query = query.filter(models.AttendanceRecord.date <= date_to)

    records = query.order_by(models.AttendanceRecord.timestamp.desc()).all()
    result = []
    for r in records:
        result.append(schemas.AttendanceOut(
            id=r.id,
            student_id=r.student_id,
            subject_id=r.subject_id,
            timestamp=r.timestamp,
            date=r.date,
            method=r.method,
            liveness_passed=r.liveness_passed,
            confidence=r.confidence,
            status=r.status,
            subject_name=r.subject.name if r.subject else None,
            student_name=r.student.name if r.student else None,
        ))
    return result


@router.get("/stats/student/{student_id}")
def student_stats(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    total = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id == student_id
    ).count()
    attended = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id == student_id,
        models.AttendanceRecord.status == "present",
    ).count()
    percentage = (attended / total * 100) if total > 0 else 0.0

    # Per-subject breakdown
    subjects = db.query(models.Subject).all()
    subject_breakdown = []
    for subj in subjects:
        s_total = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.student_id == student_id,
            models.AttendanceRecord.subject_id == subj.id,
        ).count()
        s_attended = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.student_id == student_id,
            models.AttendanceRecord.subject_id == subj.id,
            models.AttendanceRecord.status == "present",
        ).count()
        if s_total > 0:
            subject_breakdown.append({
                "subject_id": subj.id,
                "subject_name": subj.name,
                "teacher_name": subj.teacher_name,
                "total_classes": s_total,
                "attended": s_attended,
                "percentage": round(s_attended / s_total * 100, 1),
            })

    return {
        "total_classes": total,
        "attended": attended,
        "percentage": round(percentage, 1),
        "below_threshold": percentage < 60,
        "subject_breakdown": subject_breakdown,
    }


@router.get("/admin/summary")
def admin_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    """Admin: system-wide attendance summary."""
    total_students = db.query(models.User).filter(models.User.role == "student", models.User.is_active == True).count()
    total_records = db.query(models.AttendanceRecord).count()
    today_str = date.today().isoformat()
    today_present = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.date == today_str,
        models.AttendanceRecord.status == "present",
    ).count()

    # Students below 60%
    low_attendance_students = []
    students = db.query(models.User).filter(models.User.role == "student", models.User.is_active == True).all()
    for s in students:
        total = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.student_id == s.id).count()
        attended = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.student_id == s.id,
            models.AttendanceRecord.status == "present"
        ).count()
        if total > 0:
            pct = (attended / total) * 100
            if pct < 60:
                low_attendance_students.append({
                    "student_id": s.id,
                    "name": s.name,
                    "percentage": round(pct, 1),
                })

    # Daily attendance trend (last 14 days)
    # Get current date
    today = date.today()
    # We want a count of present records for each of the last 14 days
    trend_data = db.query(
        models.AttendanceRecord.date,
        func.count(models.AttendanceRecord.id).label("count")
    ).filter(
        models.AttendanceRecord.status == "present"
    ).group_by(
        models.AttendanceRecord.date
    ).order_by(
        models.AttendanceRecord.date.desc()
    ).limit(14).all()

    # Convert to expected format for frontend
    daily_trend = []
    for row in reversed(trend_data):
        daily_trend.append({
            "date": str(row[0]),
            "count": int(row[1])
        })

    return {
        "total_students": total_students,
        "total_records": total_records,
        "today_present": today_present,
        "low_attendance_count": len(low_attendance_students),
        "low_attendance_students": low_attendance_students,
        "daily_trend": daily_trend,
    }
