# CodeFlow - Launch Both Backend & Frontend
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Launching CodeFlow Backend (FastAPI) & Frontend (Vite) " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Backend in new process
Write-Host "[1/2] Starting Backend Server (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; `$env:PYTHONPATH='backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# 2. Start Frontend in new process
Write-Host "[2/2] Starting Frontend Server (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; bun run dev -- --host 127.0.0.1 --port 5173"

# 3. Open Browser
Start-Sleep -Seconds 2
Write-Host "Opening http://127.0.0.1:5173/ in browser..." -ForegroundColor Yellow
Start-Process "http://127.0.0.1:5173/"

Write-Host "CodeFlow is running! Enjoy exploring real runtime visualizations." -ForegroundColor Cyan
