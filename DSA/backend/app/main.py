from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .models.trace import ExecutionRequest, ExecutionResult
from .models.feedback import FeedbackRequest, FeedbackResponse
from .executor.sandbox import SandboxExecutor
from .tracer.parser import analyze_source_ast, StaticAnalysisResult
from .services.email_service import process_feedback

app = FastAPI(
    title="CodeFlow Execution & Tracing API",
    version="1.0.0",
    description="Live code execution, runtime event instrumentation, and normalized trace generator for CodeFlow.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

executor = SandboxExecutor(default_timeout=5.0)


class PreviewRequest(BaseModel):
    code: str


@app.get("/")
@app.get("/api")
def root_check():
    return {"status": "ok", "service": "CodeFlow Execution Engine", "version": "1.0.0"}


@app.get("/api/health")
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "CodeFlow Execution Engine", "version": "1.0.0"}


@app.post("/api/preview", response_model=StaticAnalysisResult)
@app.post("/preview", response_model=StaticAnalysisResult)
def preview_code(req: PreviewRequest):
    return analyze_source_ast(req.code)


@app.post("/api/execute", response_model=ExecutionResult)
@app.post("/execute", response_model=ExecutionResult)
def execute_code(req: ExecutionRequest):
    return executor.execute(
        code=req.code,
        max_steps=req.max_steps,
        timeout=req.timeout_seconds,
    )


@app.post("/api/feedback", response_model=FeedbackResponse)
@app.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(req: FeedbackRequest):
    res = process_feedback(req)
    return FeedbackResponse(**res)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
