from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

payload = {
    "name": "Bikki Test",
    "email": "bikki.test1@gmail.com",
    "password": "Password@123",
    "student_id": "BT/CSE/24/099",
    "department": "CSE",
    "semester": 6,
    "section": "A",
    "role": "student"
}

response = client.post("/auth/register", json=payload)
print("WITH STUDENT_ID:", response.status_code, response.json())

payload2 = {
    "name": "Bikki Test2",
    "email": "bikki.test2@gmail.com",
    "password": "Password@123",
    "department": "CSE",
    "semester": 6,
    "section": "A",
    "role": "student"
}
response2 = client.post("/auth/register", json=payload2)
print("WITHOUT STUDENT_ID:", response2.status_code, response2.json())
