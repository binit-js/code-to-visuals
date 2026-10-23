import inspect
from typing import Any, Dict, List, Set, Tuple, Optional
from ..models.trace import ObjectDescriptor, VariableDescriptor, DetectedStructure


PRIMITIVE_TYPES = (int, float, str, bool, type(None))


def get_safe_repr(val: Any, max_len: int = 60) -> str:
    try:
        r = repr(val)
        if len(r) > max_len:
            return r[:max_len - 3] + "..."
        return r
    except Exception:
        return f"<{type(val).__name__} instance>"


def serialize_value(
    val: Any,
    heap: Dict[str, ObjectDescriptor],
    visited: Set[int],
    depth: int = 0,
    max_depth: int = 4
) -> Tuple[Any, Optional[str]]:
    """
    Returns (primitive_or_summary, ref_id_if_complex).
    Populates `heap` with serialized object descriptors for non-primitives.
    """
    if isinstance(val, PRIMITIVE_TYPES):
        return val, None

    obj_id = f"obj_{id(val)}"

    # If already visited at this or earlier step, return the ref_id
    if id(val) in visited:
        return None, obj_id

    visited.add(id(val))

    if depth > max_depth:
        # Avoid recursion runaway
        heap[obj_id] = ObjectDescriptor(
            id=obj_id,
            type=type(val).__name__,
            class_name=type(val).__name__,
            value_repr=get_safe_repr(val),
        )
        return None, obj_id

    val_type = type(val).__name__

    if isinstance(val, (list, tuple, set)):
        elements = []
        is_tuple_or_set = isinstance(val, (tuple, set))
        # Limit element count to 100 for safety
        for item in list(val)[:100]:
            if isinstance(item, PRIMITIVE_TYPES):
                elements.append(item)
            else:
                _, sub_ref = serialize_value(item, heap, visited, depth + 1, max_depth)
                elements.append({"$ref": sub_ref} if sub_ref else get_safe_repr(item))

        heap[obj_id] = ObjectDescriptor(
            id=obj_id,
            type="tuple" if isinstance(val, tuple) else ("set" if isinstance(val, set) else "list"),
            class_name=val_type,
            value_repr=get_safe_repr(val),
            elements=elements,
        )
        return None, obj_id

    elif isinstance(val, dict):
        entries = []
        # Limit entries to 100
        for k, v in list(val.items())[:100]:
            k_repr = k if isinstance(k, PRIMITIVE_TYPES) else get_safe_repr(k)
            if isinstance(v, PRIMITIVE_TYPES):
                v_entry = v
            else:
                _, v_ref = serialize_value(v, heap, visited, depth + 1, max_depth)
                v_entry = {"$ref": v_ref} if v_ref else get_safe_repr(v)
            entries.append([k_repr, v_entry])

        heap[obj_id] = ObjectDescriptor(
            id=obj_id,
            type="dict",
            class_name="dict",
            value_repr=get_safe_repr(val),
            entries=entries,
        )
        return None, obj_id

    else:
        # Custom object / class instance
        fields: Dict[str, Any] = {}
        # Only inspect __dict__ to avoid triggering property side-effects
        raw_dict = getattr(val, "__dict__", None)
        if isinstance(raw_dict, dict):
            for k, v in list(raw_dict.items())[:50]:
                if k.startswith("__"):
                    continue
                if isinstance(v, PRIMITIVE_TYPES):
                    fields[k] = v
                else:
                    _, sub_ref = serialize_value(v, heap, visited, depth + 1, max_depth)
                    fields[k] = {"$ref": sub_ref} if sub_ref else get_safe_repr(v)

        heap[obj_id] = ObjectDescriptor(
            id=obj_id,
            type="custom",
            class_name=val_type,
            value_repr=get_safe_repr(val),
            fields=fields if fields else None,
        )
        return None, obj_id


def inspect_scope_variables(
    locals_dict: Dict[str, Any],
    heap: Dict[str, ObjectDescriptor]
) -> Dict[str, VariableDescriptor]:
    variables: Dict[str, VariableDescriptor] = {}
    visited_ids: Set[int] = set()

    for name, val in locals_dict.items():
        if name.startswith("__") and name.endswith("__"):
            continue
        # Also filter out modules, functions, classes from simple variable inspector if needed
        if inspect.ismodule(val) or inspect.isfunction(val) or inspect.isclass(val):
            continue

        is_prim = isinstance(val, PRIMITIVE_TYPES)
        type_name = type(val).__name__
        val_repr = get_safe_repr(val)

        if is_prim:
            variables[name] = VariableDescriptor(
                name=name,
                type=type_name,
                value_repr=val_repr,
                is_primitive=True,
                value=val,
                ref_id=None,
            )
        else:
            _, ref_id = serialize_value(val, heap, visited_ids, depth=0)
            variables[name] = VariableDescriptor(
                name=name,
                type=type_name,
                value_repr=val_repr,
                is_primitive=False,
                value=None,
                ref_id=ref_id,
            )

    return variables
