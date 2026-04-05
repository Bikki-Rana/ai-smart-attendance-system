from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── Auth ────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "student"
    student_id: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    name: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    student_id: Optional[str]
    department: Optional[str]
    semester: Optional[int]
    section: Optional[str]
    face_registered: bool
    profile_image: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Subjects ────────────────────────────────────────────────────────────────
class SubjectCreate(BaseModel):
    name: str
    code: Optional[str] = None
    teacher_name: Optional[str] = None
    teacher_code: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None


class SubjectOut(SubjectCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Timetable ───────────────────────────────────────────────────────────────
class TimetableSlotOut(BaseModel):
    id: int
    day: str
    start_time: str
    end_time: str
    subject_id: int
    section: Optional[str]
    room: Optional[str]
    subject_name: Optional[str] = None
    teacher_name: Optional[str] = None

    class Config:
        from_attributes = True


class CurrentClassOut(BaseModel):
    subject_id: Optional[int]
    subject_name: Optional[str]
    teacher_name: Optional[str]
    start_time: Optional[str]
    end_time: Optional[str]
    is_ongoing: bool


# ─── Attendance ──────────────────────────────────────────────────────────────
class AttendanceOut(BaseModel):
    id: int
    student_id: int
    subject_id: int
    timestamp: datetime
    date: str
    method: str
    liveness_passed: bool
    confidence: Optional[float]
    status: str
    subject_name: Optional[str] = None
    student_name: Optional[str] = None

    class Config:
        from_attributes = True


class AttendanceMarkResponse(BaseModel):
    success: bool
    message: str
    student_name: Optional[str] = None
    subject_name: Optional[str] = None
    confidence: Optional[float] = None


# ─── Alerts ──────────────────────────────────────────────────────────────────
class AlertOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    alert_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Reports ─────────────────────────────────────────────────────────────────
class StudentStats(BaseModel):
    total_classes: int
    attended: int
    percentage: float
    below_threshold: bool


class SubjectAttendance(BaseModel):
    subject_id: int
    subject_name: str
    teacher_name: Optional[str]
    total_classes: int
    attended: int
    percentage: float
