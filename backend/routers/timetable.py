"""Timetable Router: upload timetable, get current class, schedule view"""
import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user, require_admin
from utils.timetable_parser import get_current_class, get_full_timetable, get_day_schedule
import models

router = APIRouter(prefix="/timetable", tags=["Timetable"])


@router.get("/current-class")
def current_class(current_user: models.User = Depends(get_current_user)):
    """Get the currently active class based on time."""
    return get_current_class()


@router.get("/schedule")
def full_schedule(current_user: models.User = Depends(get_current_user)):
    """Get full weekly timetable."""
    return get_full_timetable()


@router.get("/day/{day}")
def day_schedule(day: str, current_user: models.User = Depends(get_current_user)):
    """Get timetable for a specific day."""
    return get_day_schedule(day)


@router.post("/upload")
async def upload_timetable(
    file: UploadFile = File(...),
    current_user: models.User = Depends(require_admin),
):
    """Upload a timetable PDF for parsing."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    upload_path = f"./uploads/{file.filename}"
    with open(upload_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    return {
        "message": "Timetable uploaded successfully",
        "filename": file.filename,
        "note": "Timetable has been loaded. Current static timetable is active."
    }


@router.get("/subjects-list")
def subjects_list(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get all subjects from DB + static timetable."""
    db_subjects = db.query(models.Subject).all()
    return [{"id": s.id, "name": s.name, "code": s.code, "teacher_name": s.teacher_name} for s in db_subjects]
