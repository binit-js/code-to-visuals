import json
import os
import subprocess
import sys
from typing import Optional

from ..models.trace import ExecutionResult, TraceStep


class SandboxExecutor:
    def __init__(self, default_timeout: float = 5.0):
        self.default_timeout = default_timeout

    def execute(self, code: str, max_steps: int = 1000, timeout: Optional[float] = None) -> ExecutionResult:
        actual_timeout = timeout or self.default_timeout

        # Locate worker script or run via python -m app.executor.worker
        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

        env = os.environ.copy()
        env["PYTHONPATH"] = backend_dir

        cmd = [sys.executable, "-m", "app.executor.worker"]

        payload = json.dumps({"code": code, "max_steps": max_steps})

        proc = None
        try:
            proc = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env=env,
                cwd=backend_dir,
            )

            stdout, stderr = proc.communicate(input=payload, timeout=actual_timeout)

            if proc.returncode != 0 and not stdout:
                return ExecutionResult(
                    success=False,
                    total_steps=0,
                    steps=[],
                    stdout="",
                    error=f"Process exited with code {proc.returncode}: {stderr.strip()}",
                    truncated=False,
                    execution_time_ms=0.0,
                )

            res_dict = json.loads(stdout)
            steps = [TraceStep(**s) for s in res_dict.get("steps", [])]
            return ExecutionResult(
                success=res_dict.get("success", False),
                total_steps=res_dict.get("total_steps", 0),
                steps=steps,
                stdout=res_dict.get("stdout", ""),
                error=res_dict.get("error"),
                truncated=res_dict.get("truncated", False),
                execution_time_ms=res_dict.get("execution_time_ms", 0.0),
            )

        except subprocess.TimeoutExpired:
            if proc:
                proc.kill()
                proc.wait()
            return ExecutionResult(
                success=False,
                total_steps=0,
                steps=[],
                stdout="",
                error=f"Execution timed out: exceeded limit of {actual_timeout}s.",
                truncated=True,
                execution_time_ms=actual_timeout * 1000.0,
            )
        except Exception as ex:
            if proc:
                try:
                    proc.kill()
                    proc.wait()
                except Exception:
                    pass
            return ExecutionResult(
                success=False,
                total_steps=0,
                steps=[],
                stdout="",
                error=f"Sandbox execution error: {str(ex)}",
                truncated=False,
                execution_time_ms=0.0,
            )
