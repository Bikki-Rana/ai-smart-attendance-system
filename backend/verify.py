import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

print("Testing backend imports...")
errors = []

try:
    import fastapi
    print(f"  [OK] FastAPI {fastapi.__version__}")
except Exception as e:
    errors.append(f"  [FAIL] fastapi: {e}")

try:
    import sqlalchemy
    print(f"  [OK] SQLAlchemy {sqlalchemy.__version__}")
except Exception as e:
    errors.append(f"  [FAIL] sqlalchemy: {e}")

try:
    import passlib
    print(f"  [OK] passlib")
except Exception as e:
    errors.append(f"  [FAIL] passlib: {e}")

try:
    import jose
    print(f"  [OK] python-jose")
except Exception as e:
    errors.append(f"  [FAIL] jose: {e}")

try:
    import uvicorn
    print(f"  [OK] uvicorn {uvicorn.__version__}")
except Exception as e:
    errors.append(f"  [FAIL] uvicorn: {e}")

try:
    import pdfplumber
    print(f"  [OK] pdfplumber")
except Exception as e:
    errors.append(f"  [FAIL] pdfplumber: {e}")

try:
    import openpyxl
    print(f"  [OK] openpyxl")
except Exception as e:
    errors.append(f"  [FAIL] openpyxl: {e}")

try:
    import cv2
    print(f"  [OK] OpenCV {cv2.__version__}")
except Exception as e:
    errors.append(f"  [WARN] opencv-python: {e} (will be installed)")

try:
    import mediapipe
    print(f"  [OK] MediaPipe {mediapipe.__version__}")
except Exception as e:
    errors.append(f"  [WARN] mediapipe: {e} (will be installed)")

try:
    from deepface import DeepFace
    print(f"  [OK] DeepFace")
except Exception as e:
    errors.append(f"  [WARN] deepface: {e} (will be installed)")

print()
if errors:
    print("Warnings/Errors:")
    for e in errors:
        print(e)
else:
    print("All imports successful!")

print()
print("Testing app startup...")
try:
    os.chdir(os.path.dirname(__file__))
    from database import engine, Base
    import models
    Base.metadata.create_all(bind=engine)
    print("  [OK] Database tables created: smartattend.db")
except Exception as e:
    print(f"  [FAIL] DB setup: {e}")

try:
    from auth_utils import hash_password, create_access_token
    h = hash_password("test123")
    t = create_access_token({"sub": "1"})
    print("  [OK] Auth utilities working")
except Exception as e:
    print(f"  [FAIL] auth_utils: {e}")

try:
    from utils.timetable_parser import get_current_class, get_full_timetable
    cls = get_current_class()
    tt = get_full_timetable()
    print(f"  [OK] Timetable parser: {len(tt)} slots loaded")
    if cls["is_ongoing"]:
        print(f"  [OK] Current class: {cls['subject_name']} ({cls['teacher_name']})")
    else:
        print(f"  [OK] No class right now (day: {cls['day']})")
except Exception as e:
    print(f"  [FAIL] timetable_parser: {e}")

print()
print("=" * 50)
print("Backend verification complete!")
print("Run: python -m uvicorn main:app --reload")
print("=" * 50)
