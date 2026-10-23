from typing import Any, Dict, List, Optional, Set, Tuple
from ..models.trace import DetectedStructure, ObjectDescriptor, VariableDescriptor


def _extract_node_value(obj: ObjectDescriptor) -> Any:
    """Safely extracts human-readable value from a node object."""
    if not obj.fields:
        return obj.value_repr or "?"
    for key in ("val", "value", "data", "key", "item", "element"):
        if key in obj.fields:
            v = obj.fields[key]
            if isinstance(v, dict) and "$ref" in v:
                return v["$ref"]
            return v
    return obj.value_repr or "?"


def _is_stack_candidate(var_name: str, class_name: str) -> bool:
    v_lower = var_name.lower()
    c_lower = class_name.lower()
    return (
        "stack" in v_lower
        or "stack" in c_lower
        or v_lower in ("st", "stk", "lifo")
    )


def _is_queue_candidate(var_name: str, class_name: str) -> bool:
    v_lower = var_name.lower()
    c_lower = class_name.lower()
    return (
        "queue" in v_lower
        or "queue" in c_lower
        or "deque" in v_lower
        or "deque" in c_lower
        or v_lower in ("q", "que", "fifo")
    )


def detect_structures_in_step(
    variables: Dict[str, VariableDescriptor],
    heap: Dict[str, ObjectDescriptor]
) -> List[DetectedStructure]:
    detected: List[DetectedStructure] = []
    seen_roots: Set[str] = set()

    # Build reference mapping: ref_id -> list of variable names referencing it
    pointers_by_ref: Dict[str, List[str]] = {}
    # Also collect integer pointers for arrays: name -> int value
    int_pointers: Dict[str, int] = {}

    for var_name, var_desc in variables.items():
        if var_name.startswith("__"):
            continue
        if var_desc.ref_id:
            pointers_by_ref.setdefault(var_desc.ref_id, []).append(var_name)
        elif var_desc.is_primitive and isinstance(var_desc.value, int):
            int_pointers[var_name] = var_desc.value

    # First pass: check for custom linked nodes and trees
    # Collect all custom objects that look like linked list nodes or tree nodes
    ll_node_ids: Set[str] = set()
    tree_node_ids: Set[str] = set()

    for obj_id, obj in heap.items():
        if obj.type == "custom" and obj.fields:
            fields = obj.fields
            has_next = any(k in fields for k in ("next", "next_node", "nxt", "succ", "child"))
            has_left_right = (
                ("left" in fields and "right" in fields)
                or ("left_child" in fields and "right_child" in fields)
            )
            if has_left_right:
                tree_node_ids.add(obj_id)
            elif has_next or "val" in fields or "value" in fields or "data" in fields:
                if has_next:
                    ll_node_ids.add(obj_id)

    # Process variables in scope
    for var_name, var_desc in variables.items():
        if var_name.startswith("__") or var_desc.is_primitive or not var_desc.ref_id:
            continue

        ref_id = var_desc.ref_id
        if ref_id not in heap:
            continue

        obj = heap[ref_id]

        # 1. Stacks and Queues (Python list or collections.deque or custom Stack/Queue class)
        if obj.type == "list":
            elements = obj.elements or []

            # Check if Stack
            if _is_stack_candidate(var_name, obj.class_name):
                seen_roots.add(ref_id)
                top_idx = len(elements) - 1 if elements else None
                detected.append(
                    DetectedStructure(
                        name=var_name,
                        kind="stack",
                        root_id=ref_id,
                        payload={
                            "elements": elements,
                            "size": len(elements),
                            "top_index": top_idx,
                            "top_value": elements[-1] if elements else None,
                            "pointers": pointers_by_ref.get(ref_id, [var_name]),
                        },
                    )
                )
                continue

            # Check if Queue
            if _is_queue_candidate(var_name, obj.class_name):
                seen_roots.add(ref_id)
                detected.append(
                    DetectedStructure(
                        name=var_name,
                        kind="queue",
                        root_id=ref_id,
                        payload={
                            "elements": elements,
                            "size": len(elements),
                            "front_index": 0 if elements else None,
                            "rear_index": len(elements) - 1 if elements else None,
                            "front_value": elements[0] if elements else None,
                            "rear_value": elements[-1] if elements else None,
                            "pointers": pointers_by_ref.get(ref_id, [var_name]),
                        },
                    )
                )
                continue

            # Check if 2D list (Matrix)
            if (
                len(elements) > 0
                and all(
                    isinstance(elem, dict) and "$ref" in elem and elem["$ref"] in heap and heap[elem["$ref"]].type == "list"
                    for elem in elements
                )
            ):
                matrix_data = []
                for elem in elements:
                    sub_obj = heap[elem["$ref"]]
                    matrix_data.append(sub_obj.elements or [])
                detected.append(
                    DetectedStructure(
                        name=var_name,
                        kind="matrix",
                        root_id=ref_id,
                        payload={
                            "rows": len(matrix_data),
                            "cols": len(matrix_data[0]) if matrix_data else 0,
                            "matrix": matrix_data,
                            "raw_elements": elements,
                        },
                    )
                )
                continue

            # Default: 1D Array
            # Attach pointers whose values match valid indices in this array
            matching_pointers = {
                p_name: p_val
                for p_name, p_val in int_pointers.items()
                if 0 <= p_val < len(elements) and p_name != var_name and p_name != "len"
            }
            detected.append(
                DetectedStructure(
                    name=var_name,
                    kind="array",
                    root_id=ref_id,
                    payload={
                        "length": len(elements),
                        "elements": elements,
                        "pointers": matching_pointers,
                    },
                )
            )
            continue

        # 2. Binary Tree
        if ref_id in tree_node_ids and ref_id not in seen_roots:
            # Determine tree root: if var_name is 'root' or similar, prefer it
            tree_nodes = []
            visited_tree: Set[str] = set()
            queue = [ref_id]

            while queue and len(tree_nodes) < 64:
                curr_id = queue.pop(0)
                if curr_id in visited_tree:
                    continue
                visited_tree.add(curr_id)
                curr_obj = heap.get(curr_id)
                if not curr_obj or not curr_obj.fields:
                    continue

                c_fields = curr_obj.fields
                val = _extract_node_value(curr_obj)
                left_ref = None
                right_ref = None

                left_field = c_fields.get("left", c_fields.get("left_child"))
                if isinstance(left_field, dict) and "$ref" in left_field:
                    left_ref = left_field["$ref"]
                    if left_ref not in visited_tree:
                        queue.append(left_ref)

                right_field = c_fields.get("right", c_fields.get("right_child"))
                if isinstance(right_field, dict) and "$ref" in right_field:
                    right_ref = right_field["$ref"]
                    if right_ref not in visited_tree:
                        queue.append(right_ref)

                tree_nodes.append({
                    "id": curr_id,
                    "val": val,
                    "left_id": left_ref,
                    "right_id": right_ref,
                    "pointers": pointers_by_ref.get(curr_id, []),
                })

            if tree_nodes:
                seen_roots.add(ref_id)
                for tn in tree_nodes:
                    seen_roots.add(tn["id"])

                detected.append(
                    DetectedStructure(
                        name=var_name,
                        kind="binary_tree",
                        root_id=ref_id,
                        payload={
                            "nodes": tree_nodes,
                            "root_id": ref_id,
                            "total_nodes": len(tree_nodes),
                        },
                    )
                )
                continue

        # 3. Linked List
        if ref_id in ll_node_ids and ref_id not in seen_roots:
            # Traverse chain starting from ref_id
            nodes = []
            curr_id: Optional[str] = ref_id
            visited_ll: Set[str] = set()
            has_cycle = False
            cycle_target = None
            is_doubly = False

            while curr_id and len(nodes) < 64:
                if curr_id in visited_ll:
                    has_cycle = True
                    cycle_target = curr_id
                    break
                visited_ll.add(curr_id)
                curr_node = heap.get(curr_id)
                if not curr_node or not curr_node.fields:
                    break

                c_fields = curr_node.fields
                val = _extract_node_value(curr_node)
                next_field = c_fields.get("next", c_fields.get("next_node", c_fields.get("nxt", c_fields.get("succ"))))
                next_ref = None
                if isinstance(next_field, dict) and "$ref" in next_field:
                    next_ref = next_field["$ref"]

                prev_field = c_fields.get("prev", c_fields.get("previous", c_fields.get("prev_node")))
                prev_ref = None
                if isinstance(prev_field, dict) and "$ref" in prev_field:
                    prev_ref = prev_field["$ref"]
                    is_doubly = True

                nodes.append({
                    "id": curr_id,
                    "val": val,
                    "next_id": next_ref,
                    "prev_id": prev_ref,
                    "pointers": pointers_by_ref.get(curr_id, []),
                })
                curr_id = next_ref

            # Find unlinked / pending nodes held in variables (e.g. new_node = Node(5))
            unlinked_nodes = []
            for u_var, u_desc in variables.items():
                if u_desc.ref_id and u_desc.ref_id in ll_node_ids and u_desc.ref_id not in visited_ll:
                    u_obj = heap.get(u_desc.ref_id)
                    if u_obj and u_obj.fields:
                        u_fields = u_obj.fields
                        u_val = _extract_node_value(u_obj)
                        u_next = None
                        n_field = u_fields.get("next", u_fields.get("next_node"))
                        if isinstance(n_field, dict) and "$ref" in n_field:
                            u_next = n_field["$ref"]
                        unlinked_nodes.append({
                            "id": u_desc.ref_id,
                            "val": u_val,
                            "next_id": u_next,
                            "pointers": pointers_by_ref.get(u_desc.ref_id, [u_var]),
                        })
                        seen_roots.add(u_desc.ref_id)

            if nodes:
                seen_roots.add(ref_id)
                for n in nodes:
                    seen_roots.add(n["id"])

                detected.append(
                    DetectedStructure(
                        name=var_name,
                        kind="linked_list",
                        root_id=ref_id,
                        payload={
                            "nodes": nodes,
                            "head_id": ref_id,
                            "has_cycle": has_cycle,
                            "cycle_target": cycle_target,
                            "is_doubly": is_doubly,
                            "unlinked_nodes": unlinked_nodes,
                        },
                    )
                )
                continue

        # 4. Graph (Adjacency Dictionary or Edge List)
        if obj.type == "dict" and obj.entries:
            is_adjacency_dict = True
            edges = []
            graph_nodes = set()

            for entry in obj.entries:
                if len(entry) != 2:
                    is_adjacency_dict = False
                    break
                u, v_list = entry
                u_str = str(u)
                graph_nodes.add(u_str)

                # Check if v_list is a ref to a list or inline list
                if isinstance(v_list, dict) and "$ref" in v_list:
                    sub_list = heap.get(v_list["$ref"])
                    if sub_list and sub_list.type in ("list", "set", "tuple"):
                        for neighbor in sub_list.elements or []:
                            v_val = neighbor if not isinstance(neighbor, dict) else neighbor.get("$ref", str(neighbor))
                            edges.append({"from": u_str, "to": str(v_val)})
                            graph_nodes.add(str(v_val))
                    else:
                        is_adjacency_dict = False
                        break
                elif isinstance(v_list, (list, set, tuple)):
                    for neighbor in v_list:
                        edges.append({"from": u_str, "to": str(neighbor)})
                        graph_nodes.add(str(neighbor))
                else:
                    is_adjacency_dict = False
                    break

            if is_adjacency_dict and len(graph_nodes) > 0:
                # Find active variables that point to graph nodes (e.g. curr_node = 'A')
                active_graph_pointers = {}
                for vn, vd in variables.items():
                    if vd.is_primitive and str(vd.value) in graph_nodes:
                        active_graph_pointers[vn] = str(vd.value)

                detected.append(
                    DetectedStructure(
                        name=var_name,
                        kind="graph",
                        root_id=ref_id,
                        payload={
                            "nodes": sorted(list(graph_nodes)),
                            "edges": edges,
                            "active_pointers": active_graph_pointers,
                        },
                    )
                )
                continue

        # 5. Fallback: Generic Object
        if not any(d.name == var_name for d in detected) and ref_id not in seen_roots:
            detected.append(
                DetectedStructure(
                    name=var_name,
                    kind="generic",
                    root_id=ref_id,
                    payload={
                        "type": obj.type,
                        "class_name": obj.class_name,
                        "value_repr": obj.value_repr,
                        "fields": obj.fields,
                        "elements": obj.elements,
                        "entries": obj.entries,
                    },
                )
            )

    return detected
