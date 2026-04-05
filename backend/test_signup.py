import urllib.request
import json

payload = {
    "name": "Ayush Singh",
    "email": "ayush@gmail.com",
    "password": "Ayush@123",
    "student_id": "BT/CSE/23/060",
    "department": "CSE",
    "semester": 6,
    "section": "A",
    "role": "student"
}

data = json.dumps(payload).encode()
req = urllib.request.Request(
    "http://127.0.0.1:8000/auth/register",
    data=data,
    headers={"Content-Type": "application/json"},
    method="POST"
)
try:
    r = urllib.request.urlopen(req)
    print("SUCCESS:", r.read().decode())
except urllib.error.HTTPError as e:
    print("ERROR:", e.code, e.read().decode())
except Exception as e:
    print("EXCEPTION:", e)
