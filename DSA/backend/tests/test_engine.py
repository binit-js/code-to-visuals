import pytest
from app.executor.sandbox import SandboxExecutor
from app.tracer.parser import analyze_source_ast


@pytest.fixture
def executor():
    return SandboxExecutor(default_timeout=6.0)


def test_first_demonstration_array_mutations(executor):
    code = """
arr = [10, 20, 30]
arr.append(40)
arr.pop(1)
print(arr)
"""
    result = executor.execute(code)
    assert result.success is True
    assert result.total_steps > 0
    assert "[10, 30, 40]" in result.stdout

    # Verify that arr has the expected elements in the final step
    final_step = result.steps[-1]
    assert "arr" in final_step.variables
    arr_desc = final_step.variables["arr"]
    assert arr_desc.ref_id is not None
    heap_obj = final_step.heap[arr_desc.ref_id]
    assert heap_obj.elements == [10, 30, 40]

    # Verify mutations were captured
    all_mutations = [m for s in result.steps for m in s.mutations]
    ops = [m.operation for m in all_mutations]
    assert "append" in ops
    assert "pop" in ops


def test_loop_and_conditionals(executor):
    code = """
arr = [5, 15, 25, 35]
for i in range(len(arr)):
    if arr[i] > 15:
        arr[i] = arr[i] * 2
print(arr)
"""
    result = executor.execute(code)
    assert result.success is True
    assert "[5, 15, 50, 70]" in result.stdout

    # Find step after loop
    final_step = result.steps[-1]
    arr_desc = final_step.variables["arr"]
    heap_obj = final_step.heap[arr_desc.ref_id]
    assert heap_obj.elements == [5, 15, 50, 70]


def test_custom_linked_list_detection(executor):
    code = """
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

head = Node(1)
head.next = Node(2)
head.next.next = Node(3)
"""
    result = executor.execute(code)
    assert result.success is True

    # Look for detected structure in last step
    final_step = result.steps[-1]
    ll_structures = [d for d in final_step.detected_structures if d.kind == "linked_list"]
    assert len(ll_structures) >= 1
    ll = ll_structures[0]
    nodes = ll.payload["nodes"]
    assert len(nodes) == 3
    assert [n["val"] for n in nodes] == [1, 2, 3]


def test_binary_tree_detection(executor):
    code = """
class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

root = TreeNode(10)
root.left = TreeNode(5)
root.right = TreeNode(15)
"""
    result = executor.execute(code)
    assert result.success is True

    final_step = result.steps[-1]
    tree_structures = [d for d in final_step.detected_structures if d.kind == "binary_tree"]
    assert len(tree_structures) >= 1
    tree = tree_structures[0]
    nodes = tree.payload["nodes"]
    assert len(nodes) == 3
    vals = {n["val"] for n in nodes}
    assert vals == {10, 5, 15}


def test_recursion_call_stack(executor):
    code = """
def fact(n):
    if n <= 1:
        return 1
    return n * fact(n - 1)

res = fact(3)
"""
    result = executor.execute(code)
    assert result.success is True

    # Check maximum call depth reached
    max_depth = max(s.call_depth for s in result.steps)
    assert max_depth >= 3

    # Check final value
    final_step = result.steps[-1]
    assert final_step.variables["res"].value == 6


def test_graph_adjacency_list(executor):
    code = """
graph = {
    "A": ["B", "C"],
    "B": ["D"],
    "C": ["D"],
    "D": []
}
"""
    result = executor.execute(code)
    assert result.success is True

    final_step = result.steps[-1]
    graph_structures = [d for d in final_step.detected_structures if d.kind == "graph"]
    assert len(graph_structures) >= 1
    g = graph_structures[0]
    assert set(g.payload["nodes"]) == {"A", "B", "C", "D"}


def test_sandbox_security_restricted_import(executor):
    code = """
import os
"""
    result = executor.execute(code)
    assert result.success is False
    assert "ImportError" in result.error


def test_sandbox_infinite_loop_timeout(executor):
    code = """
x = 0
while True:
    x += 1
"""
    result = executor.execute(code, timeout=1.5)
    assert result.success is False
    assert "timed out" in result.error.lower()


def test_ast_preview_analysis():
    code = """
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

arr = [1, 2, 3]
matrix = [[1, 2], [3, 4]]
def helper(): pass
"""
    analysis = analyze_source_ast(code)
    assert analysis.valid_syntax is True
    assert "Node" in analysis.classes
    assert "helper" in analysis.functions
    assert any(s.kind == "linked_list_class" for s in analysis.structures)
    assert any(s.kind == "array" for s in analysis.structures)
    assert any(s.kind == "matrix" for s in analysis.structures)


def test_stack_detection_and_explanation(executor):
    code = """
stack = []
stack.append(10)
stack.append(20)
val = stack.pop()
"""
    result = executor.execute(code)
    assert result.success is True
    assert result.total_steps > 0

    # Verify detected structure has kind="stack"
    stack_detected = [
        s for step in result.steps for s in step.detected_structures if s.kind == "stack"
    ]
    assert len(stack_detected) > 0

    # Verify step explanations exist and contain what, why, visual_change
    explanations = [s.explanation for s in result.steps if s.explanation is not None]
    assert len(explanations) > 0
    for exp in explanations:
        assert exp.what
        assert exp.why
        assert exp.visual_change

    # Check push and pop explanations
    push_exps = [e for e in explanations if e.action_type == "push"]
    pop_exps = [e for e in explanations if e.action_type == "pop"]
    assert len(push_exps) >= 1
    assert len(pop_exps) >= 1
    assert "Pushed" in push_exps[0].what
    assert "Popped" in pop_exps[0].what


def test_queue_detection_and_explanation(executor):
    code = """
queue = []
queue.append("apple")
queue.append("banana")
first = queue.pop(0)
"""
    result = executor.execute(code)
    assert result.success is True

    # Verify queue detected
    queue_detected = [
        s for step in result.steps for s in step.detected_structures if s.kind == "queue"
    ]
    assert len(queue_detected) > 0

    # Verify explanations have what, why, visual_change
    enq_exps = [s.explanation for s in result.steps if s.explanation and s.explanation.action_type == "enqueue"]
    assert len(enq_exps) >= 1
    assert "Enqueued" in enq_exps[0].what


def test_linked_list_insertion_and_pointer_tracking(executor):
    code = """
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

head = Node(1)
head.next = Node(3)

# Insert node 2 between 1 and 3
new_node = Node(2)
new_node.next = head.next
head.next = new_node
"""
    result = executor.execute(code)
    assert result.success is True

    # Find step where new_node is created but not linked yet
    step_with_unlinked = None
    for step in result.steps:
        for s in step.detected_structures:
            if s.kind == "linked_list" and len(s.payload.get("unlinked_nodes", [])) > 0:
                step_with_unlinked = step
                break
    assert step_with_unlinked is not None

    # Check final step has full 1 -> 2 -> 3 chain
    final_step = result.steps[-1]
    ll_struct = next(s for s in final_step.detected_structures if s.kind == "linked_list")
    node_vals = [n["val"] for n in ll_struct.payload["nodes"]]
    assert node_vals == [1, 2, 3]

    # Verify pointer badges attached to nodes
    pointers_found = any(len(n.get("pointers", [])) > 0 for n in ll_struct.payload["nodes"])
    assert pointers_found is True

