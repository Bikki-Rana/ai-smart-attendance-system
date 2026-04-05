"""Users Router: CRUD, face enrollment, profile"""
import os
import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from dependencies import get_current_user, require_admin
from auth_utils import hash_password
from ai.face_engine import register_face, delete_face
import models
import schemas

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    return db.query(models.User).filter(models.User.is_active == True).all()


@router.get("/students", response_model=List[schemas.UserOut])
def list_students(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    return db.query(models.User).filter(
        models.User.role == "student",
        models.User.is_active == True
    ).all()


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Students can only view own profile
    if current_user.role == "student" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=schemas.UserOut)
def create_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        student_id=user_data.student_id,
        department=user_data.department,
        semester=user_data.semester,
        section=user_data.section,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log = models.AuditLog(user_id=current_user.id, action="ADMIN_CREATE_USER", details=f"Created {user.name}")
    db.add(log)
    db.commit()
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin accounts")

    delete_face(user_id)
    user.is_active = False
    db.commit()

    log = models.AuditLog(user_id=current_user.id, action="ADMIN_DELETE_USER", details=f"Deleted {user.name}")
    db.add(log)
    db.commit()
    return {"message": f"User {user.name} deleted successfully"}


@router.post("/{user_id}/register-face")
async def register_face_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Students can only register their own face
    if current_user.role == "student" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "Send face data via /users/{user_id}/register-face-data"}


@router.post("/{user_id}/register-face-data")
async def register_face_data(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role == "student" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    b64_image = payload.get("image")
    if not b64_image:
        raise HTTPException(status_code=400, detail="No image data provided")

    success, message = register_face(user_id, b64_image)
    if not success:
        raise HTTPException(status_code=400, detail=message)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    user.face_registered = True
    db.commit()

    log = models.AuditLog(user_id=current_user.id, action="FACE_REGISTERED", details=f"User {user_id}")
    db.add(log)
    db.commit()

    return {"success": True, "message": message}


import shutil
from datetime import datetime

@router.post("/{user_id}/profile-image")
async def upload_profile_image(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Students can only upload their own picture
    if current_user.role == "student" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG)")

    # Save file to uploads folder
    ext = file.filename.split(".")[-1]
    filename = f"user_{user_id}_{int(datetime.now().timestamp())}.{ext}"
    filepath = os.path.join("uploads", filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update database
    # The URL should be relative, e.g., /api/uploads/filename
    # Since our frontend proxy rewrites /api to empty, the real URL is /api/uploads/filename
    user.profile_image = f"/api/uploads/{filename}"
    db.commit()

    log = models.AuditLog(user_id=current_user.id, action="PROFILE_IMAGE_UPDATED", details=f"User {user_id}")
    db.add(log)
    db.commit()

    return {"success": True, "profile_image": user.profile_image}


@router.get("/{user_id}/face-image")
def get_face_image(user_id: int, current_user: models.User = Depends(get_current_user)):
    img_path = f"./face_db/user_{user_id}.jpg"
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="No face image found")
    return FileResponse(img_path, media_type="image/jpeg")
