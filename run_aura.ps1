# AURA - AI-Based Urban Rescue Assistance System Launcher
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " AURA -- AI-Based Urban Rescue Assistance System (Hyderabad)" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

Write-Host "`n[1/3] Starting Backend Server (FastAPI + WebSockets)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "[2/3] Starting Frontend Server (Vite React)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location frontend; npm run dev"

Write-Host "[3/3] Waiting 4 seconds for services to boot..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

Write-Host "`nOpening browser at http://localhost:3000 ..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "`nServices running:" -ForegroundColor Cyan
Write-Host " - Frontend Web:      http://localhost:3000" -ForegroundColor White
Write-Host " - Backend API:       http://localhost:8000/docs" -ForegroundColor White
Write-Host " - WebSockets:        ws://localhost:8000/ws/telemetry" -ForegroundColor White
Write-Host " - Android Mobile:    cd mobile; npx expo start`n" -ForegroundColor Green
