"""Alerts Router: notifications management"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from dependencies import get_current_user, require_admin
import models
import schemas

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/", response_model=List[schemas.AlertOut])
def get_alerts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role == "admin":
        return db.query(models.Alert).order_by(models.Alert.created_at.desc()).limit(50).all()
    return db.query(models.Alert).filter(
        models.Alert.user_id == current_user.id
    ).order_by(models.Alert.created_at.desc()).all()


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    count = db.query(models.Alert).filter(
        models.Alert.user_id == current_user.id,
        models.Alert.is_read == False,
    ).count()
    return {"count": count}


@router.patch("/{alert_id}/read")
def mark_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    alert = db.query(models.Alert).filter(
        models.Alert.id == alert_id,
        models.Alert.user_id == current_user.id,
    ).first()
    if alert:
        alert.is_read = True
        db.commit()
    return {"success": True}


@router.patch("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db.query(models.Alert).filter(
        models.Alert.user_id == current_user.id,
        models.Alert.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"success": True}


@router.post("/broadcast")
def broadcast_alert(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    """Admin can broadcast an alert to all students."""
    students = db.query(models.User).filter(models.User.role == "student", models.User.is_active == True).all()
    for student in students:
        alert = models.Alert(
            user_id=student.id,
            title=payload.get("title", "System Notification"),
            message=payload.get("message", ""),
            alert_type=payload.get("alert_type", "info"),
        )
        db.add(alert)
    db.commit()
    return {"success": True, "sent_to": len(students)}
