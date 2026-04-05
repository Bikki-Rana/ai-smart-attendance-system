from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    student = "student"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    student_id = Column(String(50), unique=True, nullable=True)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(20), default="student")
    department = Column(String(100), nullable=True)
    semester = Column(Integer, nullable=True)
    section = Column(String(10), nullable=True)
    face_registered = Column(Boolean, default=False)
    profile_image = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

    # Relationships
    attendance_records = relationship("AttendanceRecord", back_populates="student")
    alerts = relationship("Alert", back_populates="user")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(50), nullable=True)
    teacher_name = Column(String(100), nullable=True)
    teacher_code = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True)
    semester = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    timetable_slots = relationship("TimetableSlot", back_populates="subject")
    attendance_records = relationship("AttendanceRecord", back_populates="subject")


class TimetableSlot(Base):
    __tablename__ = "timetable_slots"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(String(20), nullable=False)           # Monday, Tuesday, etc.
    start_time = Column(String(10), nullable=False)    # HH:MM
    end_time = Column(String(10), nullable=False)      # HH:MM
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    section = Column(String(10), nullable=True)
    room = Column(String(50), nullable=True)

    subject = relationship("Subject", back_populates="timetable_slots")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    date = Column(String(20), nullable=False)          # YYYY-MM-DD
    method = Column(String(30), default="face_recognition")
    liveness_passed = Column(Boolean, default=False)
    confidence = Column(Float, nullable=True)
    status = Column(String(20), default="present")     # present / absent

    student = relationship("User", back_populates="attendance_records")
    subject = relationship("Subject", back_populates="attendance_records")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    alert_type = Column(String(50), default="info")    # info, warning, danger
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="alerts")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    action = Column(String(200), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
