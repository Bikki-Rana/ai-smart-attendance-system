from sqlalchemy.orm import Session
from database import SessionLocal
import schemas
from routers.auth import register
from fastapi import HTTPException

def test_duplicate():
    db = SessionLocal()
    payload = schemas.UserCreate(
        name="Bikki Test3",
        email="bikki.test3@gmail.com",
        password="Password@123",
        department="CSE",
        semester=6,
        section="A",
        role="student"
    )
    try:
        register(payload, db)
    except HTTPException as e:
        print("HTTPException:", e.status_code, e.detail)
    except Exception as e:
        print("Exception:", e)
    finally:
        db.close()

if __name__ == "__main__":
    test_duplicate()
