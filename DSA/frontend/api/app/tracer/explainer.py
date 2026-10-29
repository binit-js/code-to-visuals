from typing import Any, Dict, List, Optional
from ..models.trace import (
    MutationEvent,
    DetectedStructure,
    ObjectDescriptor,
    VariableDescriptor,
    StepExplanation,
)


def generate_step_explanation(
    line: int,
    line_code: str,
    event_type: str,
    function_name: str,
    call_depth: int,
    variables: Dict[str, VariableDescriptor],
    prev_variables: Dict[str, VariableDescriptor],
    heap: Dict[str, ObjectDescriptor],
    prev_heap: Dict[str, ObjectDescriptor],
    mutations: List[MutationEvent],
    detected_structures: List[DetectedStructure],
    stdout_delta: str,
    exception: Optional[str] = None,
    return_value: Optional[str] = None,
) -> StepExplanation:
    clean_line = line_code.strip()

    # 1. Exception event
    if event_type == "exception" or exception:
        exc_clean = exception or "Runtime Error"
        return StepExplanation(
            what=f"An error occurred: {exc_clean}.",
            why="The program attempted an invalid operation (such as division by zero, null reference, or index out of range).",
            visual_change=f"Execution halted on line {line} before the error could corrupt the program.",
            action_type="exception",
            highlighted_keys=[clean_line] if clean_line else [],
        )

    # 2. Function Call event
    if event_type == "call":
        if function_name == "<module>":
            return StepExplanation(
                what="Starting program execution.",
                why="Initializing the global environment and preparing variables.",
                visual_change="Execution started at the top of the file.",
                action_type="call",
                highlighted_keys=["start"],
            )
        args_str = ", ".join(f"{k}={v.value_repr}" for k, v in variables.items() if not k.startswith("__"))
        return StepExplanation(
            what=f"Calling function {function_name}({args_str}).",
            why=f"We are invoking '{function_name}' to start working with the given input values.",
            visual_change=f"A new stack frame was created for {function_name}() at depth {call_depth}.",
            action_type="call",
            highlighted_keys=[function_name],
        )

    # 3. If there are active mutations (append, pop, setitem, setattr), explain mutations FIRST
    # even if event_type is return (e.g. final line mutation in module)
    struct_by_kind = {s.kind: s for s in detected_structures}

    # 4. Check for Stack operations
    if "stack" in struct_by_kind:
        stack_struct = struct_by_kind["stack"]
        s_name = stack_struct.name
        recent_mut = next((m for m in mutations if m.target_name == s_name or m.target_id == stack_struct.root_id), None)
        if recent_mut:
            if recent_mut.operation == "append":
                val = recent_mut.value
                return StepExplanation(
                    what=f"Pushed value '{val}' onto the top of stack '{s_name}'.",
                    why="In a stack (LIFO: Last In, First Out), newly added items always sit on top.",
                    visual_change=f"A new element [{val}] appeared at the top of the stack tower.",
                    action_type="push",
                    highlighted_keys=[s_name, str(val)],
                )
            elif recent_mut.operation == "pop":
                val = recent_mut.value
                return StepExplanation(
                    what=f"Popped value '{val}' from the top of stack '{s_name}'.",
                    why="We remove the most recently added item from the stack.",
                    visual_change=f"The top element was removed, and the TOP pointer moved to the next item.",
                    action_type="pop",
                    highlighted_keys=[s_name],
                )

    # 5. Check for Queue operations
    if "queue" in struct_by_kind:
        q_struct = struct_by_kind["queue"]
        q_name = q_struct.name
        recent_mut = next((m for m in mutations if m.target_name == q_name or m.target_id == q_struct.root_id), None)
        if recent_mut:
            if recent_mut.operation == "append":
                val = recent_mut.value
                return StepExplanation(
                    what=f"Enqueued value '{val}' at the back of queue '{q_name}'.",
                    why="In a queue (FIFO: First In, First Out), new items always enter at the rear.",
                    visual_change=f"Element [{val}] was added to the REAR of the queue line.",
                    action_type="enqueue",
                    highlighted_keys=[q_name, str(val)],
                )
            elif recent_mut.operation == "pop":
                val = recent_mut.value
                return StepExplanation(
                    what=f"Dequeued value '{val}' from the front of queue '{q_name}'.",
                    why="In a queue, the item waiting the longest at the front is served first.",
                    visual_change=f"The FRONT element [{val}] departed, and the next element is now first in line.",
                    action_type="dequeue",
                    highlighted_keys=[q_name],
                )

    # 6. Check for Linked List pointer reassignments (e.g. curr.next = new_node or prev.next = curr.next)
    if "linked_list" in struct_by_kind:
        ll_struct = struct_by_kind["linked_list"]
        for m in mutations:
            if m.operation == "setattr" and m.index_or_key in ("next", "next_node", "nxt", "succ"):
                target_node = heap.get(m.target_id)
                target_val = target_node.fields.get("val", target_node.fields.get("data", "?")) if target_node and target_node.fields else "?"
                # What is the new next node value?
                next_val = "None"
                if isinstance(m.value, dict) and "$ref" in m.value:
                    next_node = heap.get(m.value["$ref"])
                    if next_node and next_node.fields:
                        next_val = next_node.fields.get("val", next_node.fields.get("data", m.value["$ref"]))
                elif m.value is not None:
                    next_val = str(m.value)

                return StepExplanation(
                    what=f"Connecting node ({target_val})'s next pointer to node ({next_val}).",
                    why="We are rewiring the link to insert, bypass, or attach nodes in the chain.",
                    visual_change=f"The arrow from node [{target_val}] now points directly to node [{next_val}].",
                    action_type="link_update",
                    highlighted_keys=[str(target_val), str(next_val)],
                )

    # 7. Check for Tree pointer updates (e.g. root.left = Node(...) or curr.right = ...)
    if "binary_tree" in struct_by_kind:
        for m in mutations:
            if m.operation == "setattr" and m.index_or_key in ("left", "right", "left_child", "right_child"):
                branch = "left" if "left" in str(m.index_or_key) else "right"
                target_node = heap.get(m.target_id)
                target_val = target_node.fields.get("val", "?") if target_node and target_node.fields else "?"
                child_val = "None"
                if isinstance(m.value, dict) and "$ref" in m.value:
                    child_node = heap.get(m.value["$ref"])
                    if child_node and child_node.fields:
                        child_val = child_node.fields.get("val", "?")
                return StepExplanation(
                    what=f"Connecting the {branch} child of node ({target_val}) to node ({child_val}).",
                    why=f"Building or modifying the {branch} branch of the binary tree hierarchy.",
                    visual_change=f"A new branch arrow now connects node [{target_val}] to [{child_val}] on the {branch} side.",
                    action_type="tree_link",
                    highlighted_keys=[str(target_val), str(child_val)],
                )

    # 8. Check for Array Swaps or Mutations
    for m in mutations:
        if m.operation == "append":
            return StepExplanation(
                what=f"Appended value '{m.value}' to list '{m.target_name or 'array'}'.",
                why="Adding a new element to the end of the collection.",
                visual_change=f"Added cell [{m.value}] at index {m.index_or_key}.",
                action_type="append",
                highlighted_keys=[m.target_name or "array", str(m.index_or_key)],
            )
        elif m.operation == "pop":
            return StepExplanation(
                what=f"Removed element at index {m.index_or_key} with value '{m.value}'.",
                why="Deleting or retrieving the element from that position.",
                visual_change=f"Cell [{m.index_or_key}] was removed from {m.target_name or 'array'}.",
                action_type="pop",
                highlighted_keys=[m.target_name or "array"],
            )
        elif m.operation == "setitem":
            # Check if swap happened (e.g. arr[i], arr[j] = arr[j], arr[i])
            return StepExplanation(
                what=f"Set index [{m.index_or_key}] in '{m.target_name or 'array'}' to '{m.value}'.",
                why="Updating this array slot with the newly computed or swapped value.",
                visual_change=f"Cell [{m.index_or_key}] was highlighted and updated to [{m.value}].",
                action_type="setitem",
                highlighted_keys=[m.target_name or "array", str(m.index_or_key)],
            )

    # 9. Function Return event (if no mutation occurred on return)
    if event_type == "return":
        ret = return_value or "None"
        if function_name == "<module>":
            return StepExplanation(
                what="Program execution completed successfully.",
                why="The script reached its final line and completed.",
                visual_change="Final state and final output are confirmed.",
                action_type="return",
                highlighted_keys=["done"],
            )
        return StepExplanation(
            what=f"Function {function_name}() finished and returned {ret}.",
            why="All instructions in this function completed or reached a return statement.",
            visual_change=f"The call stack frame for {function_name}() is popped and control returns to the caller.",
            action_type="return",
            highlighted_keys=[function_name, ret],
        )

    # 10. Pointer movement or variable updates
    # Check if a pointer variable (like curr, prev, left, right, mid, i, j) changed
    changed_vars: List[str] = []
    for v_name, v_desc in variables.items():
        if v_name.startswith("__"):
            continue
        p_desc = prev_variables.get(v_name)
        if not p_desc or p_desc.value_repr != v_desc.value_repr:
            changed_vars.append(v_name)

    if changed_vars:
        primary_var = changed_vars[0]
        curr_desc = variables[primary_var]
        prev_desc = prev_variables.get(primary_var)

        # Check if this variable points to a Node (Linked list traversal: curr = curr.next)
        if not curr_desc.is_primitive and curr_desc.ref_id:
            node_obj = heap.get(curr_desc.ref_id)
            if node_obj and node_obj.fields and ("next" in node_obj.fields or "left" in node_obj.fields):
                node_val = node_obj.fields.get("val", node_obj.fields.get("data", "?"))
                return StepExplanation(
                    what=f"Moved pointer '{primary_var}' to node ({node_val}).",
                    why=f"Advancing '{primary_var}' to navigate the structure step by step.",
                    visual_change=f"The [{primary_var}] badge moved above node ({node_val}).",
                    action_type="pointer_move",
                    highlighted_keys=[primary_var, str(node_val)],
                )

        # Check if this variable is an array index pointer (e.g. i, j, left, right, mid, ptr)
        if curr_desc.is_primitive and isinstance(curr_desc.value, int):
            old_str = f"from {prev_desc.value} " if prev_desc and prev_desc.value is not None else ""
            return StepExplanation(
                what=f"Updated index pointer '{primary_var}' {old_str}to {curr_desc.value}.",
                why=f"Moving '{primary_var}' to track or examine index [{curr_desc.value}].",
                visual_change=f"The [{primary_var}] marker shifted over array index [{curr_desc.value}].",
                action_type="pointer_move",
                highlighted_keys=[primary_var, str(curr_desc.value)],
            )

        # General variable assignment
        old_val_str = f"from {prev_desc.value_repr} " if prev_desc else ""
        return StepExplanation(
            what=f"Set variable '{primary_var}' {old_val_str}to {curr_desc.value_repr}.",
            why=f"Computing and saving the result of line {line}.",
            visual_change=f"Variable '{primary_var}' updated in the inspector panel.",
            action_type="assign",
            highlighted_keys=[primary_var],
        )

    # 10. Control flow: loops & branches
    if clean_line.startswith("for ") or " in " in clean_line:
        return StepExplanation(
            what=f"Loop iteration at line {line}: {clean_line}.",
            why="Iterating through the items in sequence until all items have been processed.",
            visual_change="Advancing loop counter to the next item.",
            action_type="loop",
            highlighted_keys=[clean_line],
        )
    if clean_line.startswith("while "):
        return StepExplanation(
            what=f"Checking while loop condition: '{clean_line}'.",
            why="The loop body will execute if this condition evaluates to True; otherwise, the loop exits.",
            visual_change="Evaluating condition to decide whether to continue the loop.",
            action_type="loop",
            highlighted_keys=[clean_line],
        )
    if clean_line.startswith("if ") or clean_line.startswith("elif "):
        return StepExplanation(
            what=f"Evaluating conditional decision: '{clean_line}'.",
            why="Testing whether to take this branch or skip to the next section.",
            visual_change="Testing condition to choose execution path.",
            action_type="branch",
            highlighted_keys=[clean_line],
        )

    # 11. Printed output
    if stdout_delta.strip():
        return StepExplanation(
            what=f"Printed to console: \"{stdout_delta.strip()}\".",
            why="The code called print() to display information to standard output.",
            visual_change=f"Appended \"{stdout_delta.strip()}\" to the output log.",
            action_type="print",
            highlighted_keys=[stdout_delta.strip()],
        )

    # Default fallback
    return StepExplanation(
        what=f"Executed line {line}: {clean_line or 'step'}.",
        why="Performing this operation in the program flow.",
        visual_change="State synchronized with the visualizer.",
        action_type="step",
        highlighted_keys=[clean_line] if clean_line else [],
    )
