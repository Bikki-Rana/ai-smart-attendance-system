import os
import shutil
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "smartattend-super-secret-key-2024")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smartattend.db")
FACE_MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", 0.6))
LIVENESS_BLINK_COUNT = int(os.getenv("LIVENESS_BLINK_COUNT", 2))

FACE_DB_PATH = "./face_db"
os.makedirs(FACE_DB_PATH, exist_ok=True)
os.makedirs("./uploads", exist_ok=True)
os.makedirs("./exports", exist_ok=True)
