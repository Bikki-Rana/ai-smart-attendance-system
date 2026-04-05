"""
Face Recognition Engine using DeepFace
Handles: face encoding, face comparison, student enrollment
"""
import os
import base64
import json
import numpy as np
from pathlib import Path
from typing import Optional, Tuple
from config import FACE_DB_PATH, FACE_MATCH_THRESHOLD

# Lazy imports — loaded only when first used so server starts even without these packages
_cv2 = None
_DeepFace = None

def _get_cv2():
    global _cv2
    if _cv2 is None:
        try:
            import cv2
            _cv2 = cv2
        except ImportError:
            raise ImportError("opencv-python is not installed. Run: pip install opencv-python-headless")
    return _cv2

def _get_deepface():
    global _DeepFace
    if _DeepFace is None:
        try:
            from deepface import DeepFace
            _DeepFace = DeepFace
        except ImportError:
            raise ImportError("deepface is not installed. Run: pip install deepface")
    return _DeepFace

EMBEDDINGS_FILE = os.path.join(FACE_DB_PATH, "embeddings.json")
MODEL_NAME = "Facenet512"
DETECTOR = "opencv"


def _load_embeddings() -> dict:
    """Load all stored face embeddings from disk."""
    if not os.path.exists(EMBEDDINGS_FILE):
        return {}
    try:
        with open(EMBEDDINGS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_embeddings(embeddings: dict):
    """Persist embeddings to disk."""
    with open(EMBEDDINGS_FILE, "w") as f:
        json.dump(embeddings, f)


def _decode_base64_image(b64_string: str) -> np.ndarray:
    """Convert base64 image string to numpy array (BGR)."""
    cv2 = _get_cv2()
    # Strip data URL prefix if present
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    img_bytes = base64.b64decode(b64_string)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img


def _get_embedding(img: np.ndarray) -> Optional[list]:
    """Generate face embedding from image using DeepFace."""
    DeepFace = _get_deepface()
    try:
        result = DeepFace.represent(
            img_path=img,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR,
            enforce_detection=True,
        )
        if result and len(result) > 0:
            return result[0]["embedding"]
        return None
    except Exception as e:
        print(f"[FaceEngine] Embedding error: {e}")
        return None


def _cosine_similarity(emb1: list, emb2: list) -> float:
    """Calculate cosine similarity between two embeddings."""
    a = np.array(emb1)
    b = np.array(emb2)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def register_face(user_id: int, b64_image: str) -> Tuple[bool, str]:
    """
    Register a new face for a student.
    Returns (success, message)
    """
    try:
        img = _decode_base64_image(b64_image)
        if img is None:
            return False, "Invalid image data"

        embedding = _get_embedding(img)
        if embedding is None:
            return False, "No face detected in image. Please ensure your face is clearly visible."

        embeddings = _load_embeddings()
        embeddings[str(user_id)] = embedding
        _save_embeddings(embeddings)

        # Also save the image
        cv2 = _get_cv2()
        img_path = os.path.join(FACE_DB_PATH, f"user_{user_id}.jpg")
        cv2.imwrite(img_path, img)

        return True, "Face registered successfully"
    except Exception as e:
        print(f"[FaceEngine] Register error: {e}")
        return False, f"Face registration failed: {str(e)}"


def identify_face(b64_image: str) -> Tuple[Optional[int], float]:
    """
    Identify a person from a webcam snapshot.
    Returns (user_id, confidence_score) or (None, 0.0)
    """
    try:
        img = _decode_base64_image(b64_image)
        if img is None:
            return None, 0.0

        embedding = _get_embedding(img)
        if embedding is None:
            return None, 0.0

        embeddings = _load_embeddings()
        if not embeddings:
            return None, 0.0

        best_match_id = None
        best_similarity = -1.0

        for uid_str, stored_emb in embeddings.items():
            similarity = _cosine_similarity(embedding, stored_emb)
            if similarity > best_similarity:
                best_similarity = similarity
                best_match_id = int(uid_str)

        # Threshold check (cosine similarity, higher = better)
        threshold = 1.0 - FACE_MATCH_THRESHOLD  # convert distance threshold
        if best_similarity >= threshold:
            return best_match_id, round(best_similarity * 100, 2)
        return None, round(best_similarity * 100, 2)

    except Exception as e:
        print(f"[FaceEngine] Identify error: {e}")
        return None, 0.0


def delete_face(user_id: int) -> bool:
    """Remove face data for a user."""
    try:
        embeddings = _load_embeddings()
        if str(user_id) in embeddings:
            del embeddings[str(user_id)]
            _save_embeddings(embeddings)

        img_path = os.path.join(FACE_DB_PATH, f"user_{user_id}.jpg")
        if os.path.exists(img_path):
            os.remove(img_path)
        return True
    except Exception:
        return False
