@echo off
title CodeFlow - Dynamic Code Visualization
echo ========================================================
echo   Starting CodeFlow Backend (FastAPI) and Frontend (Vite)
echo ========================================================

cd /d "%~dp0"

echo [1/2] Starting Backend Server on port 8000...
start "CodeFlow Backend (Port 8000)" cmd /k "set PYTHONPATH=backend&& python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Frontend Server on port 5173...
start "CodeFlow Frontend (Port 5173)" cmd /k "cd frontend&& bun run dev -- --host 127.0.0.1 --port 5173"

timeout /t 3 /nobreak >nul 2>&1 || ping -n 4 127.0.0.1 >nul
echo Opening browser at http://127.0.0.1:5173/ ...
start http://127.0.0.1:5173/

echo ========================================================
echo   CodeFlow is now running!
echo   Frontend: http://127.0.0.1:5173/
echo   Backend:  http://127.0.0.1:8000/
echo ========================================================
