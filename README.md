# SmartAttend — AI-Powered Attendance System 🎓

> **Production-ready** smart attendance platform with Face Recognition, Liveness Detection (Anti-Spoofing), role-based dashboards, timetable intelligence, and rich analytics.

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Bikki-Rana/ai-smart-attendance-system.git
cd ai-smart-attendance-system
```

### 2. First-Time Setup
> This will auto-install all Python and Node.js dependencies (~5-15 min for AI packages).
```bat
setup.bat
```

### 3. Run the Application (Every Time)
```bat
start.bat
```
*(This script starts both servers and opens the app at `http://localhost:5173`)*

---

## 🌐 Access

| Service   | URL                          |
|-----------|------------------------------|
| App       | http://localhost:5173         |
| API       | http://localhost:8000         |
| API Docs  | http://localhost:8000/docs    |

**Default Admin:** `admin@smartattend.com` / `admin123`

---

## 🧰 Tech Stack

| Layer            | Technology                        |
|------------------|-----------------------------------|
| Frontend         | React.js + Vite + Tailwind CSS    |
| Backend          | Python FastAPI                    |
| Face Recognition | DeepFace (Facenet512 model)       |
| Liveness         | MediaPipe FaceMesh (EAR blink)    |
| Database         | SQLite (SQLAlchemy ORM)           |
| Auth             | JWT (python-jose) + bcrypt        |
| Charts           | Recharts                          |
| Export           | openpyxl (Excel) + csv            |

---

## 📁 Project Structure

```
SmartAttend/
├── frontend/                React + Vite + Tailwind
│   └── src/
│       ├── pages/           Landing, Login, Signup, Dashboards,
│       │                    Attendance, Reports, Profile, Timetable
│       ├── components/      Sidebar, Layout
│       ├── store/           Zustand (auth + attendance)
│       └── api/             Axios client with JWT
│
├── backend/                 Python FastAPI
│   ├── main.py              App entry point + admin seed
│   ├── models.py            SQLAlchemy ORM models
│   ├── schemas.py           Pydantic schemas
│   ├── auth_utils.py        JWT + bcrypt
│   ├── dependencies.py      Route guards
│   ├── routers/
│   │   ├── auth.py          Login, Register, Me
│   │   ├── users.py         CRUD users + face enrollment
│   │   ├── attendance.py    Mark, get, admin summary
│   │   ├── timetable.py     Schedule, current class
│   │   ├── reports.py       Export CSV/Excel, heatmap
│   │   └── alerts.py        Notifications management
│   ├── ai/
│   │   ├── face_engine.py   DeepFace recognition + embeddings
│   │   └── liveness.py      MediaPipe blink/EAR detection
│   └── utils/
│       ├── timetable_parser.py  CSE VI Sem timetable + time detection
│       └── export_utils.py      Styled Excel/CSV export
│
├── start.bat                One-click launcher
├── setup.bat                First-time setup
└── README.md
```

---

## ✨ Features

### 🎯 AI Engine
- **Face Recognition** — DeepFace (Facenet512) with cosine similarity matching
- **Liveness Detection** — MediaPipe EAR (Eye Aspect Ratio) blink analysis
- **Anti-Spoofing** — Rejects photos, screens, and printed images
- **Real-time Processing** — Multi-frame capture for accuracy

### 👨‍💼 Admin Features
- Dashboard with stats, charts, low-attendance alerts
- Add/Delete students (with face registration status)
- View all attendance records (searchable, filterable)
- Export all data → CSV / Excel (.xlsx)
- Broadcast notifications to all students
- Upload timetable file
- Audit logs for all system actions

### 🎓 Student Features
- Self-registration with face capture
- Mark attendance via face scan (liveness required)
- Dashboard: overall %, subject-wise breakdown
- Export own attendance → CSV / Excel
- Timetable view with live class indicator
- Receive alerts if attendance < 60%

### ⏰ Timetable Intelligence
- CSE VI Semester Spring 2026 timetable built-in
- Auto-detects current subject based on time
- Shows teacher name for each class
- Countdown timer for active class

### 📊 Analytics
- Bar charts (subject-wise attendance)
- Line charts (monthly trend)
- Day-wise attendance heatmap
- Radial percentage ring on student dashboard

### 🔔 Alert System
- Auto-generates low attendance warnings (<60%)
- In-app notification bell with unread count
- Admin can broadcast to all students

---

## 🔐 Security
- Passwords hashed with **bcrypt**
- **JWT** auth (24h expiry)
- Role-based API protection (admin/student)
- Face recognition prevents **proxy attendance**
- Liveness detection prevents **photo/video spoof**

---

## 📤 Export Formats
| Type   | Admin          | Student         |
|--------|----------------|-----------------|
| CSV    | All + Individual | Own data only |
| Excel  | All + Individual | Own data only |

---

## 🔧 Configuration

Edit `backend/.env` to configure:
```env
SECRET_KEY=your-secret-key
FACE_MATCH_THRESHOLD=0.6      # Lower = stricter
LIVENESS_BLINK_COUNT=2        # Frames required
SMTP_USER=...                 # Optional email alerts
SMTP_PASS=...
```

---

## 📋 Requirements

- **Python** 3.9+ (with pip)
- **Node.js** 18+
- Webcam (for face registration and attendance)
- ~2GB disk space (AI model weights download on first use)

---

> Built with ❤️ — SmartAttend © 2026
