# code-to-visuals

> **CodeFlow** — Dynamic Code Visualization & Interactive Learning Platform

An execution-driven DSA learning and runtime visualization platform where users write real Python code and observe its actual runtime behavior, object state transitions, and memory references synchronized step-by-step.

---

## ⚡ Quickstart

### Prerequisites
- **Python 3.10+** (with `fastapi`, `uvicorn`, `pydantic`, `pytest`)
- **Bun** or **Node.js**

### 1. Run the entire application (1-click)
On Windows, run:
```bat
run_both.bat
```
or in PowerShell:
```powershell
./run_both.ps1
```

### 2. Manual Start
**Backend (FastAPI):**
```powershell
cd DSA
$env:PYTHONPATH="backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Frontend (Vite + React):**
```powershell
cd DSA/frontend
bun run dev -- --host 127.0.0.1 --port 5173
```
Open [http://localhost:5173/](http://localhost:5173/) to start visualizing code!
