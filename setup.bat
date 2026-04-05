@echo off
setlocal enabledelayedexpansion
title SmartAttend — Setup
color 0B

echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │         SmartAttend — First-Time Setup                  │
echo  └─────────────────────────────────────────────────────────┘
echo.

REM ─── Python Portable Setup ───────────────────────────────────────────────────
echo  [1/4] Setting up portable Python 3.10 environment...
if not exist "python310\python.exe" (
    powershell -ExecutionPolicy Bypass -Command "$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.10.11/python-3.10.11-embed-amd64.zip' -OutFile 'python310.zip'; Expand-Archive -Path 'python310.zip' -DestinationPath 'python310' -Force; (Get-Content 'python310\python310._pth') -replace '#import site', 'import site' | Set-Content 'python310\python310._pth'; Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile 'python310\get-pip.py'; cd python310; .\python.exe get-pip.py"
    del python310.zip
    echo  [OK] Portable Python 3.10 installed locally!
) else (
    echo  [OK] Python 3.10 is already configured locally.
)
set PYTHON_EXE=%~dp0python310\python.exe
echo.

REM ─── Python deps ─────────────────────────────────────────────────────────────
echo  [2/4] Installing Python backend dependencies...
echo        (AI packages may take 5-15 minutes to download)
echo.
"%PYTHON_EXE%" -m pip install -r backend\requirements.txt
if errorlevel 1 (
    echo  [WARNING] Some packages failed. Trying fallback installation...
    "%PYTHON_EXE%" -m pip install fastapi uvicorn sqlalchemy passlib python-jose python-multipart
    "%PYTHON_EXE%" -m pip install deepface opencv-python mediapipe numpy Pillow pdfplumber openpyxl pandas bcrypt
)
echo installed > backend\installed.flag
echo.
echo  [OK] Python dependencies ready!
echo.

REM ─── Node deps ───────────────────────────────────────────────────────────────
echo  [3/4] Installing frontend Node.js dependencies...
cd frontend
call npm install
cd ..
echo  [OK] Frontend dependencies ready!
echo.

REM ─── Copy .env ───────────────────────────────────────────────────────────────
echo  [4/4] Setting up environment...
if not exist "backend\.env" (
    copy backend\.env.example backend\.env >nul
    echo  [OK] Created backend\.env — edit it to configure email alerts
) else (
    echo  [OK] backend\.env already exists
)

echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │  Setup Complete! Run start.bat to launch SmartAttend.   │
echo  └─────────────────────────────────────────────────────────┘
echo.
pause


