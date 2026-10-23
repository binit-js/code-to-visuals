import builtins
import io
import json
import math
import collections
import heapq
import random
import itertools
import sys
import time
from typing import Any, Dict

from app.tracer.tracer import CodeTracer


SAFE_MODULES = {
    "math": math,
    "collections": collections,
    "heapq": heapq,
    "random": random,
    "itertools": itertools,
}


def _safe_import(name, *args, **kwargs):
    if name in SAFE_MODULES:
        return SAFE_MODULES[name]
    raise ImportError(f"Import of module '{name}' is restricted in the sandbox.")


def get_safe_builtins() -> Dict[str, Any]:
    safe_names = [
        "abs", "all", "any", "ascii", "bin", "bool", "bytearray", "bytes",
        "chr", "complex", "dict", "divmod", "enumerate", "filter", "float",
        "format", "frozenset", "hasattr", "getattr", "setattr", "delattr",
        "hash", "hex", "int", "isinstance", "issubclass", "iter", "len",
        "list", "map", "max", "min", "next", "object", "oct", "ord", "pow",
        "print", "range", "repr", "reversed", "round", "set", "slice", "sorted",
        "str", "sum", "tuple", "type", "zip", "property",
        # Internal Python class builder (required for class definitions)
        "__build_class__",
        # Built-in exceptions
        "ArithmeticError", "AssertionError", "AttributeError", "BaseException",
        "Exception", "IndexError", "KeyError", "NameError", "RecursionError",
        "RuntimeError", "StopIteration", "TypeError", "ValueError", "ZeroDivisionError",
    ]

    safe_b = {k: getattr(builtins, k) for k in safe_names if hasattr(builtins, k)}
    safe_b["__import__"] = _safe_import
    return safe_b


def run_code_worker(code: str, max_steps: int = 1000) -> Dict[str, Any]:
    start_time = time.perf_counter()
    filename = "<user_code>"

    tracer = CodeTracer(filename=filename, max_steps=max_steps, code=code)

    # Capture stdout
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    sys.stdout = tracer.stdout_buffer
    sys.stderr = tracer.stdout_buffer

    safe_globals = {
        "__name__": "__main__",
        "__doc__": None,
        "__builtins__": get_safe_builtins(),
        "math": math,
        "collections": collections,
        "heapq": heapq,
        "random": random,
        "itertools": itertools,
    }

    error_msg = None
    success = True

    try:
        compiled = compile(code, filename, "exec")
        sys.settrace(tracer.trace_func)
        exec(compiled, safe_globals)
    except Exception as e:
        success = False
        error_msg = f"{type(e).__name__}: {str(e)}"
    finally:
        sys.settrace(None)
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return {
        "success": success,
        "total_steps": len(tracer.steps),
        "steps": [step.model_dump() for step in tracer.steps],
        "stdout": tracer.stdout_buffer.getvalue(),
        "error": error_msg,
        "truncated": tracer.truncated,
        "execution_time_ms": elapsed_ms,
    }


if __name__ == "__main__":
    try:
        raw_input = sys.stdin.read()
        payload = json.loads(raw_input)
        code = payload.get("code", "")
        max_steps = payload.get("max_steps", 1000)
        res = run_code_worker(code, max_steps)
        sys.stdout.write(json.dumps(res))
    except Exception as ex:
        sys.stdout.write(json.dumps({
            "success": False,
            "total_steps": 0,
            "steps": [],
            "stdout": "",
            "error": f"Worker crashed: {str(ex)}",
            "truncated": False,
            "execution_time_ms": 0.0,
        }))
    sys.stdout.flush()
