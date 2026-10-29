from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class ObjectDescriptor(BaseModel):
    id: str
    type: str
    class_name: str
    value_repr: str
    elements: Optional[List[Any]] = None  # For list, tuple, set
    fields: Optional[Dict[str, Any]] = None  # For custom classes: e.g. {"val": 10, "next": "ref_..."}
    entries: Optional[List[List[Any]]] = None  # For dicts: [[k, v], ...]


class VariableDescriptor(BaseModel):
    name: str
    type: str
    value_repr: str
    is_primitive: bool
    value: Optional[Union[int, float, str, bool, None]] = None
    ref_id: Optional[str] = None


class StackFrameDescriptor(BaseModel):
    frame_id: str
    function_name: str
    line: int
    variables: Dict[str, VariableDescriptor] = Field(default_factory=dict)


class MutationEvent(BaseModel):
    target_id: str
    target_name: Optional[str] = None
    operation: str  # e.g. "append", "pop", "insert", "setitem", "setattr", "assign"
    index_or_key: Optional[Union[int, str]] = None
    value: Optional[Any] = None
    description: Optional[str] = None


class DetectedStructure(BaseModel):
    name: str
    kind: str  # 'array' | 'matrix' | 'linked_list' | 'binary_tree' | 'graph' | 'stack' | 'queue' | 'generic'
    root_id: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)


class StepExplanation(BaseModel):
    what: str
    why: str
    visual_change: str
    action_type: str = "step"
    highlighted_keys: List[str] = Field(default_factory=list)


class TraceStep(BaseModel):
    step_index: int
    line: int
    event_type: str  # 'line' | 'call' | 'return' | 'exception'
    function_name: str
    call_depth: int
    stack_frames: List[StackFrameDescriptor] = Field(default_factory=list)
    variables: Dict[str, VariableDescriptor] = Field(default_factory=dict)
    heap: Dict[str, ObjectDescriptor] = Field(default_factory=dict)
    mutations: List[MutationEvent] = Field(default_factory=list)
    detected_structures: List[DetectedStructure] = Field(default_factory=list)
    explanation: Optional[StepExplanation] = None
    stdout: str = ""
    exception: Optional[str] = None
    return_value: Optional[str] = None


class ExecutionRequest(BaseModel):
    code: str
    language: str = "python"
    max_steps: int = 1000
    timeout_seconds: float = 5.0


class ExecutionResult(BaseModel):
    success: bool
    total_steps: int
    steps: List[TraceStep]
    stdout: str
    error: Optional[str] = None
    truncated: bool = False
    execution_time_ms: float = 0.0
