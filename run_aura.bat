@echo off
title AURA - AI-Based Urban Rescue Assistance System
echo =====================================================================
echo  AURA -- AI-Based Urban Rescue Assistance System (Hyderabad Prototype)
echo =====================================================================
echo.
echo [1/3] Starting AURA Multi-Agent Backend Server (FastAPI + WebSockets)...
start "AURA Backend Server (Port 8000)" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Starting AURA Frontend Server (Vite React Dashboard)...
cd frontend
start "AURA Frontend Console (Port 3000)" cmd /k "npm run dev"
cd ..

echo [3/3] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Launching AURA in your default browser...
start http://localhost:3000

echo.
echo =====================================================================
echo  AURA Ecosystem is now LIVE:
echo   - Web Console:        http://localhost:3000
echo   - Backend API Docs:   http://localhost:8000/docs
echo   - Telemetry Stream:   ws://localhost:8000/ws/telemetry
echo   - Android Mobile App: cd mobile ^&^& npx expo start
echo =====================================================================
echo Keep both terminal windows open while demonstrating.
pause
