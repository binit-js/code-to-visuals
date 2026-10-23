# CodeFlow — Dynamic Code Visualization & Interactive Learning Platform

> An execution-driven DSA learning and runtime visualization platform where users write real Python code and observe its actual runtime behavior, object state transitions, and memory references synchronized step-by-step.

---

## 1. System Architecture

```text
React Code Editor
       |
       v
Source Analysis / Parser (Live AST preview while typing)
       |
       v
Secure Execution Environment (Subprocess isolation, timeouts, restricted builtins)
       |
       v
Runtime Instrumentation (sys.settrace frame hooks, stdout capture)
       |
       v
Normalized Execution Trace (Line, call, return, exception, deltas)
       |
       v
Runtime Object Inspector (id(obj) tracking, aliasing, cycles, mutations)
       |
       v
Structure Detection (Array, Matrix, Linked List, Tree, Graph, Recursion, Generic)
       |
       v
Adaptive Visualization Renderer (SVG & Canvas adaptive components)
       |
       v
Timeline & Synchronized Playback (Forward/backward scrub, speed, line highlight)
```

---

## 2. Quickstart & Running the Application

### Prerequisites
- **Python 3.10+** (with `fastapi`, `uvicorn`, `pydantic`, `pytest`)
- **Bun** or **Node.js**

### Start the Backend Server (FastAPI)
```powershell
# From the project root
$env:PYTHONPATH="backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API runs on `http://127.0.0.1:8000`. Documentation available at `http://127.0.0.1:8000/docs`.

### Start the Frontend Server (Vite + React)
```powershell
cd frontend
bun install   # or npm install
bun run dev   # or npm run dev
```
Open `http://127.0.0.1:5173` in your browser.

---

## 3. Supported Features & Data Structures

| Structure / Feature | Detection & Visualization |
| :--- | :--- |
| **1D Array / List** | Indexed cells, element badges, mutation indicators (`append`, `pop`, `setitem`), pointer arrows for loop variables (`i`, `j`, `left`, `right`). |
| **2D Matrix** | Grid table layout with row `[r]` and column `[c]` headers and coordinate lookups. |
| **Singly Linked List** | Traverses `.next` pointers, renders `HEAD` badge, values, directional arrow links, and `NULL` termination; flags circular loops. |
| **Binary Tree** | Hierarchical SVG tree layout traversing `.left` and `.right` children from root. |
| **Graph** | Radial adjacency visualization connecting vertices with directed SVG arrows. |
| **Recursion Call Stack** | Multi-level frame stack tracking nested function calls, arguments, and return unwinding. |
| **Generic Object Fallback** | Safe attribute inspector for arbitrary custom Python classes and nested dictionaries. |
| **Live Structure Preview** | Real-time AST parser analyzing source while typing before execution. |
| **Synchronized Playback** | Step forward, backward, play/pause, scrub slider, speed (0.5x, 1x, 2x, 4x), synchronized source line highlighting. |
| **Sandboxed Execution** | Subprocess process isolation, 5s wall-clock timeout, 1000 steps limit, restricted module access. |

---

## 4. Running Automated Tests

### Backend Unit & Integration Tests (pytest)
```powershell
$env:PYTHONPATH="backend"
python -m pytest backend/tests -v
```

### Live End-to-End Tests (Full HTTP API Verification)
```powershell
python backend/tests/e2e_live_test.py
```

### Frontend Tests (Bun Test)
```powershell
cd frontend
bun test
```

### Production Build Verification
```powershell
cd frontend
bun run build
```
