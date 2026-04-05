"""
SmartAttend FastAPI Backend - Main Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Import DB setup and models
from database import engine, Base
import models  # noqa: F401 - registers models with Base

# Import routers
from routers import auth, users, attendance, timetable, reports, alerts

# Create all tables
Base.metadata.create_all(bind=engine)

# ─── App Instance ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="SmartAttend API",
    description="AI-Powered Smart Attendance System with Face Recognition & Liveness Detection",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static Files ─────────────────────────────────────────────────────────────
os.makedirs("./exports", exist_ok=True)
os.makedirs("./uploads", exist_ok=True)
os.makedirs("./face_db", exist_ok=True)

app.mount("/exports", StaticFiles(directory="exports"), name="exports")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(attendance.router)
app.include_router(timetable.router)
app.include_router(reports.router)
app.include_router(alerts.router)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "app": "SmartAttend API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}


# ─── Seed admin on first run ──────────────────────────────────────────────────
@app.on_event("startup")
def seed_default_admin():
    from database import SessionLocal
    from auth_utils import hash_password
    db = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.role == "admin").first()
        if not admin:
            default_admin = models.User(
                name="Admin",
                email="admin@smartattend.com",
                password_hash=hash_password("admin123"),
                role="admin",
                is_active=True,
            )
            db.add(default_admin)
            db.commit()
            print("[OK] Default admin created: admin@smartattend.com / Admin@12345!")
        else:
            print(f"[OK] Admin exists: {admin.email}")
    finally:
        db.close()
