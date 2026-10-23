import ast
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class InferredVariable(BaseModel):
    name: str
    inferred_type: str
    preview_value: Optional[str] = None
    line: int


class InferredStructure(BaseModel):
    name: str
    kind: str  # 'array' | 'matrix' | 'linked_list_class' | 'tree_class' | 'graph_dict' | 'unknown'
    description: str
    sample_data: Any = None


class StaticAnalysisResult(BaseModel):
    valid_syntax: bool
    error: Optional[str] = None
    error_line: Optional[int] = None
    variables: List[InferredVariable] = Field(default_factory=list)
    functions: List[str] = Field(default_factory=list)
    classes: List[str] = Field(default_factory=list)
    structures: List[InferredStructure] = Field(default_factory=list)


def analyze_source_ast(code: str) -> StaticAnalysisResult:
    try:
        tree = ast.parse(code)
    except SyntaxError as se:
        return StaticAnalysisResult(
            valid_syntax=False,
            error=f"SyntaxError: {se.msg} (line {se.lineno})",
            error_line=se.lineno,
        )

    variables: List[InferredVariable] = []
    functions: List[str] = []
    classes: List[str] = []
    structures: List[InferredStructure] = []

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            functions.append(node.name)
        elif isinstance(node, ast.ClassDef):
            classes.append(node.name)
            # Check if looks like a Node for linked list or tree
            attr_names = set()
            for sub in node.body:
                if isinstance(sub, ast.FunctionDef) and sub.name == "__init__":
                    for stmt in sub.body:
                        if isinstance(stmt, ast.Assign):
                            for target in stmt.targets:
                                if isinstance(target, ast.Attribute) and isinstance(target.value, ast.Name) and target.value.id == "self":
                                    attr_names.add(target.attr)
            if "left" in attr_names and "right" in attr_names:
                structures.append(
                    InferredStructure(
                        name=node.name,
                        kind="tree_class",
                        description=f"Class '{node.name}' has left/right pointers (potential Binary Tree node)",
                    )
                )
            elif "next" in attr_names or "next_node" in attr_names:
                structures.append(
                    InferredStructure(
                        name=node.name,
                        kind="linked_list_class",
                        description=f"Class '{node.name}' has next pointer (potential Linked List node)",
                    )
                )

    # Top-level assignment inspections
    for stmt in tree.body:
        if isinstance(stmt, ast.Assign):
            for target in stmt.targets:
                if isinstance(target, ast.Name):
                    var_name = target.id
                    val_node = stmt.value
                    if isinstance(val_node, ast.List):
                        # Check if 2D list
                        if val_node.elts and all(isinstance(e, ast.List) for e in val_node.elts):
                            variables.append(
                                InferredVariable(
                                    name=var_name,
                                    inferred_type="2D List (Matrix)",
                                    preview_value=f"{len(val_node.elts)}x{len(val_node.elts[0].elts)} matrix",
                                    line=stmt.lineno,
                                )
                            )
                            structures.append(
                                InferredStructure(
                                    name=var_name,
                                    kind="matrix",
                                    description="2D Matrix Literal",
                                )
                            )
                        elif any(k in var_name.lower() for k in ("stack", "stk", "lifo")):
                            variables.append(
                                InferredVariable(
                                    name=var_name,
                                    inferred_type="Stack (LIFO)",
                                    preview_value=f"Stack with {len(val_node.elts)} elements",
                                    line=stmt.lineno,
                                )
                            )
                            structures.append(
                                InferredStructure(
                                    name=var_name,
                                    kind="stack",
                                    description=f"Stack structure (LIFO order, {len(val_node.elts)} initial elements)",
                                )
                            )
                        elif any(k in var_name.lower() for k in ("queue", "deque", "fifo")):
                            variables.append(
                                InferredVariable(
                                    name=var_name,
                                    inferred_type="Queue (FIFO)",
                                    preview_value=f"Queue with {len(val_node.elts)} elements",
                                    line=stmt.lineno,
                                )
                            )
                            structures.append(
                                InferredStructure(
                                    name=var_name,
                                    kind="queue",
                                    description=f"Queue structure (FIFO order, {len(val_node.elts)} initial elements)",
                                )
                            )
                        else:
                            variables.append(
                                InferredVariable(
                                    name=var_name,
                                    inferred_type="List (Array)",
                                    preview_value=f"List of {len(val_node.elts)} elements",
                                    line=stmt.lineno,
                                )
                            )
                            structures.append(
                                InferredStructure(
                                    name=var_name,
                                    kind="array",
                                    description=f"Array with {len(val_node.elts)} initial elements",
                                )
                            )
                    elif isinstance(val_node, ast.Dict):
                        variables.append(
                            InferredVariable(
                                name=var_name,
                                inferred_type="Dictionary",
                                preview_value=f"{len(val_node.keys)} entries",
                                line=stmt.lineno,
                            )
                        )
                        structures.append(
                            InferredStructure(
                                name=var_name,
                                kind="graph_dict",
                                description="Dictionary (potential Adjacency List)",
                            )
                        )
                    elif isinstance(val_node, ast.Constant):
                        variables.append(
                            InferredVariable(
                                name=var_name,
                                inferred_type=type(val_node.value).__name__,
                                preview_value=str(val_node.value),
                                line=stmt.lineno,
                            )
                        )

    return StaticAnalysisResult(
        valid_syntax=True,
        variables=variables,
        functions=functions,
        classes=classes,
        structures=structures,
    )
