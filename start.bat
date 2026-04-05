@echo off
title SmartAttend — AI Attendance System
color 0A

echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │          SmartAttend — AI Attendance System             │
echo  │         Powered by Face Recognition + Liveness AI      │
echo  └─────────────────────────────────────────────────────────┘
echo.
echo  [*] Starting SmartAttend servers...
echo.

REM ─── Check Python ────────────────────────────────────────────────────────────
if not exist "python310\python.exe" (
    echo  [ERROR] Local Python 3.10 not found. Please run setup.bat first!
    pause
    exit /b 1
)
set PYTHON_EXE=%~dp0python310\python.exe

REM ─── Install backend deps if not done ────────────────────────────────────────
if not exist "backend\installed.flag" (
    echo  [*] Installing Python dependencies - first run only...
    echo      This may take 5-15 minutes for AI packages.
    echo.
    "%PYTHON_EXE%" -m pip install -r backend\requirements.txt
    if errorlevel 1 (
        echo  [ERROR] Failed to install Python dependencies.
        pause
        exit /b 1
    )
    echo installed > backend\installed.flag
    echo  [OK] Python dependencies installed!
    echo.
)

REM ─── Check Node.js ───────────────────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM ─── Install frontend node_modules if needed ──────────────────────────────────
if not exist "frontend\node_modules" (
    echo  [*] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo  [OK] Frontend dependencies installed!
    echo.
)

REM ─── Start Backend ───────────────────────────────────────────────────────────
echo  [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "SmartAttend Backend" cmd /k "cd backend && \"%PYTHON_EXE%\" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

REM ─── Start Frontend ──────────────────────────────────────────────────────────
echo  [2/2] Starting React Frontend on http://localhost:5173 ...
start "SmartAttend Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 5 /nobreak >nul

REM ─── Open Browser ────────────────────────────────────────────────────────────
echo.
echo  [*] Opening SmartAttend in your browser...
start http://localhost:5173

echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │  SmartAttend is now running!                            │
echo  │                                                          │
echo  │  Frontend:  http://localhost:5173                       │
echo  │  Backend:   http://localhost:8000                       │
echo  │  API Docs:  http://localhost:8000/docs                  │
echo  │                                                          │
echo  │  Default Admin:  admin@smartattend.com / admin123       │
echo  │                                                          │
echo  │  Close the terminal windows to stop the servers.        │
echo  └─────────────────────────────────────────────────────────┘
echo.
pause
