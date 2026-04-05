"""Auth Router: register, login"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import get_db
from auth_utils import hash_password, verify_password, create_access_token
from dependencies import get_current_user
import models
import schemas

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.Token)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check existing email
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Normalize enroll number to uppercase
    normalized_student_id = user_data.student_id.strip().upper() if user_data.student_id else None

    # Check for duplicate enrollment number (case-insensitive)
    if normalized_student_id:
        existing = db.query(models.User).filter(
            models.User.student_id == normalized_student_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Enroll No '{normalized_student_id}' is already registered")

    # Force student role during public registration
    role = "student"

    user = models.User(
        name=user_data.name.strip(),
        email=user_data.email.strip().lower(),
        password_hash=hash_password(user_data.password),
        role=role,
        student_id=normalized_student_id,
        department=user_data.department,
        semester=user_data.semester,
        section=user_data.section,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        err_str = str(e.orig).lower()
        if "email" in err_str:
            raise HTTPException(status_code=400, detail="Email already registered")
        elif "student_id" in err_str:
            raise HTTPException(status_code=400, detail=f"Enroll No '{normalized_student_id}' is already registered")
        else:
            raise HTTPException(status_code=400, detail="Registration failed: duplicate data")
    db.refresh(user)

    # Audit log
    log = models.AuditLog(user_id=user.id, action="USER_REGISTERED", details=f"{user.name} ({user.role})")
    db.add(log)
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return schemas.Token(
        access_token=token, token_type="bearer",
        role=user.role, user_id=user.id, name=user.name
    )


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    log = models.AuditLog(user_id=user.id, action="USER_LOGIN", details=user.email)
    db.add(log)
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return schemas.Token(
        access_token=token, token_type="bearer",
        role=user.role, user_id=user.id, name=user.name
    )


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
