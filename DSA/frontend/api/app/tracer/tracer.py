import io
import sys
import copy
from typing import Any, Dict, List, Optional, Tuple
from ..models.trace import (
    TraceStep,
    StackFrameDescriptor,
    MutationEvent,
    ObjectDescriptor,
    VariableDescriptor,
    StepExplanation,
)
from .inspector import inspect_scope_variables
from .detector import detect_structures_in_step
from .explainer import generate_step_explanation


class CodeTracer:
    def __init__(self, filename: str = "<user_code>", max_steps: int = 1000, code: str = ""):
        self.filename = filename
        self.max_steps = max_steps
        self.code = code
        self.code_lines = code.splitlines() if code else []
        self.steps: List[TraceStep] = []
        self.stdout_buffer = io.StringIO()
        self.previous_heap: Dict[str, ObjectDescriptor] = {}
        self.previous_variables: Dict[str, VariableDescriptor] = {}
        self.truncated = False
        self.last_stdout_pos = 0

    def trace_func(self, frame, event: str, arg: Any):
        if len(self.steps) >= self.max_steps:
            self.truncated = True
            sys.settrace(None)
            return None

        # Filter: only trace user code frame
        code = frame.f_code
        frame_filename = code.co_filename

        # On Windows or Linux, ensure path comparison matches user code
        if frame_filename != self.filename and not frame_filename.endswith(self.filename):
            return self.trace_func

        if event in ("line", "call", "return", "exception"):
            self._record_step(frame, event, arg)

        return self.trace_func

    def _get_stdout_delta(self) -> Tuple[str, str]:
        all_stdout = self.stdout_buffer.getvalue()
        delta = all_stdout[self.last_stdout_pos:]
        self.last_stdout_pos = len(all_stdout)
        return all_stdout, delta

    def _compute_mutations(
        self,
        current_heap: Dict[str, ObjectDescriptor],
        variables: Dict[str, VariableDescriptor]
    ) -> List[MutationEvent]:
        mutations: List[MutationEvent] = []
        # Map ref_id to variable name if available
        id_to_var: Dict[str, str] = {}
        for var_name, var_desc in variables.items():
            if var_desc.ref_id:
                id_to_var[var_desc.ref_id] = var_name

        for obj_id, curr_obj in current_heap.items():
            if obj_id in self.previous_heap:
                prev_obj = self.previous_heap[obj_id]
                var_name = id_to_var.get(obj_id)

                # Check list mutations
                if curr_obj.type == "list" and prev_obj.type == "list":
                    prev_elems = prev_obj.elements or []
                    curr_elems = curr_obj.elements or []

                    if len(curr_elems) == len(prev_elems) + 1:
                        # Append or insert
                        mutations.append(
                            MutationEvent(
                                target_id=obj_id,
                                target_name=var_name,
                                operation="append",
                                index_or_key=len(curr_elems) - 1,
                                value=curr_elems[-1],
                                description=f"Appended {curr_elems[-1]} to {var_name or 'list'}",
                            )
                        )
                    elif len(curr_elems) == len(prev_elems) - 1:
                        # Pop / deletion
                        pop_idx = len(curr_elems)
                        for i in range(len(curr_elems)):
                            if prev_elems[i] != curr_elems[i]:
                                pop_idx = i
                                break
                        removed_val = prev_elems[pop_idx] if pop_idx < len(prev_elems) else None
                        mutations.append(
                            MutationEvent(
                                target_id=obj_id,
                                target_name=var_name,
                                operation="pop",
                                index_or_key=pop_idx,
                                value=removed_val,
                                description=f"Popped element at index {pop_idx} ({removed_val}) from {var_name or 'list'}",
                            )
                        )
                    elif len(curr_elems) == len(prev_elems):
                        for idx, (p_item, c_item) in enumerate(zip(prev_elems, curr_elems)):
                            if p_item != c_item:
                                mutations.append(
                                    MutationEvent(
                                        target_id=obj_id,
                                        target_name=var_name,
                                        operation="setitem",
                                        index_or_key=idx,
                                        value=c_item,
                                        description=f"Updated index {idx} in {var_name or 'list'} to {c_item}",
                                    )
                                )

                # Check custom object field mutations (e.g. node.next = ...)
                elif curr_obj.type == "custom" and prev_obj.type == "custom":
                    prev_fields = prev_obj.fields or {}
                    curr_fields = curr_obj.fields or {}
                    for f_key, f_val in curr_fields.items():
                        if f_key not in prev_fields or prev_fields[f_key] != f_val:
                            mutations.append(
                                MutationEvent(
                                    target_id=obj_id,
                                    target_name=var_name,
                                    operation="setattr",
                                    index_or_key=f_key,
                                    value=f_val,
                                    description=f"Set attribute {f_key} to {f_val} on {var_name or curr_obj.class_name}",
                                )
                            )

        return mutations

    def _record_step(self, frame, event: str, arg: Any):
        # Build stack frames list
        stack_frames: List[StackFrameDescriptor] = []
        curr = frame
        depth = 0
        while curr:
            c_code = curr.f_code
            if c_code.co_filename == self.filename or c_code.co_filename.endswith(self.filename):
                f_heap: Dict[str, ObjectDescriptor] = {}
                f_vars = inspect_scope_variables(curr.f_locals, f_heap)
                stack_frames.append(
                    StackFrameDescriptor(
                        frame_id=f"frame_{id(curr)}",
                        function_name=c_code.co_name,
                        line=curr.f_lineno,
                        variables=f_vars,
                    )
                )
                depth += 1
            curr = curr.f_back

        # Local variables and heap in current frame
        current_heap: Dict[str, ObjectDescriptor] = {}
        variables = inspect_scope_variables(frame.f_locals, current_heap)

        # Detect mutations from previous step
        mutations = self._compute_mutations(current_heap, variables)

        # Detect high-level DSA structures (Array, LinkedList, Tree, Stack, Queue, Graph, etc.)
        detected = detect_structures_in_step(variables, current_heap)

        exception_str = None
        if event == "exception" and arg:
            exc_type, exc_val, _ = arg
            exception_str = f"{exc_type.__name__}: {exc_val}"

        return_val_str = None
        if event == "return" and arg is not None:
            try:
                return_val_str = repr(arg)
            except Exception:
                return_val_str = str(type(arg))

        all_stdout, stdout_delta = self._get_stdout_delta()
        line_num = frame.f_lineno
        line_code = self.code_lines[line_num - 1] if 0 < line_num <= len(self.code_lines) else ""

        # Generate beginner-friendly 3-part educational explanation
        explanation = generate_step_explanation(
            line=line_num,
            line_code=line_code,
            event_type=event,
            function_name=frame.f_code.co_name,
            call_depth=depth,
            variables=variables,
            prev_variables=self.previous_variables,
            heap=current_heap,
            prev_heap=self.previous_heap,
            mutations=mutations,
            detected_structures=detected,
            stdout_delta=stdout_delta,
            exception=exception_str,
            return_value=return_val_str,
        )

        step = TraceStep(
            step_index=len(self.steps),
            line=line_num,
            event_type=event,
            function_name=frame.f_code.co_name,
            call_depth=depth,
            stack_frames=stack_frames,
            variables=variables,
            heap=copy.deepcopy(current_heap),
            mutations=mutations,
            detected_structures=detected,
            explanation=explanation,
            stdout=all_stdout,
            exception=exception_str,
            return_value=return_val_str,
        )

        self.steps.append(step)
        self.previous_heap = copy.deepcopy(current_heap)
        self.previous_variables = copy.deepcopy(variables)
