import sys
from sqlalchemy.orm import Session
from database import SessionLocal
import schemas
from routers.auth import register
from fastapi import HTTPException

def test_registration():
    db = SessionLocal()
    payload = schemas.UserCreate(
        name="Bikki Test4",
        email="bikki.test4@gmail.com",
        password="Password@123",
        department="CSE",
        semester=6,
        section="A",
        role="student"
    )
    # This simulates omitting student_id in the request
    try:
        response = register(payload, db)
        print("SUCCESS:", response)
    except HTTPException as e:
        print("HTTPException:", e.status_code, e.detail)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("EXCEPTION:", e)
    finally:
        db.close()

if __name__ == "__main__":
    test_registration()
