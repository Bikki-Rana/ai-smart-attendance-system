import urllib.request
import json

payload = {
  "name": "Bikki Test Live",
  "email": "bikki.live@gmail.com",
  "password": "Password@123",
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
    with urllib.request.urlopen(req) as res:
        print("STATUS:", res.status)
        print("JSON:", res.read().decode())
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.read().decode())
except Exception as e:
    print("Exception", e)
