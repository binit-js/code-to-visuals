import json
import urllib.request
import sys

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_json(url):
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    print("================ LIVE E2E INTEGRATION TEST ================")
    
    # 1. Health Check
    health = get_json("http://127.0.0.1:8000/api/health")
    assert health["status"] == "ok", "Health check failed"
    print("[PASS] [1/10] Backend Health Check: OK")

    # 2. Preview AST Analysis
    preview_res = post_json("http://127.0.0.1:8000/api/preview", {
        "code": "arr = [10, 20, 30]\nclass Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None"
    })
    assert preview_res["valid_syntax"] is True, "Preview syntax check failed"
    assert any(s["kind"] == "array" for s in preview_res["structures"]), "Preview array structure missing"
    assert any(s["kind"] == "linked_list_class" for s in preview_res["structures"]), "Preview linked list class missing"
    print("[PASS] [2/10] Static AST Preview Analysis: OK")

    # 3. First Required Demonstration
    first_demo_code = """
arr = [10, 20, 30]
arr.append(40)
arr.pop(1)
print(arr)
"""
    res1 = post_json("http://127.0.0.1:8000/api/execute", {"code": first_demo_code})
    assert res1["success"] is True, "First demonstration failed execution"
    assert "[10, 30, 40]" in res1["stdout"], f"Expected [10, 30, 40] in stdout, got {res1['stdout']}"
    
    # Check mutations in steps
    mutations = [m for step in res1["steps"] for m in step["mutations"]]
    ops = [m["operation"] for m in mutations]
    assert "append" in ops, "Missing append mutation event"
    assert "pop" in ops, "Missing pop mutation event"
    
    # Verify final array state in heap
    final_step = res1["steps"][-1]
    arr_desc = final_step["variables"]["arr"]
    heap_obj = final_step["heap"][arr_desc["ref_id"]]
    assert heap_obj["elements"] == [10, 30, 40], f"Heap elements mismatch: {heap_obj['elements']}"
    print("[PASS] [3/10] Master Test: Array Append(40) & Pop(1): OK -> Verified [10, 30, 40]")

    # 4. Loop & Conditional Mutation
    loop_code = """
arr = [5, 15, 25, 35]
for i in range(len(arr)):
    if arr[i] > 15:
        arr[i] = arr[i] * 2
print(arr)
"""
    res2 = post_json("http://127.0.0.1:8000/api/execute", {"code": loop_code})
    assert res2["success"] is True
    assert "[5, 15, 50, 70]" in res2["stdout"]
    final_arr = res2["steps"][-1]["heap"][res2["steps"][-1]["variables"]["arr"]["ref_id"]]["elements"]
    assert final_arr == [5, 15, 50, 70]
    print("[PASS] [4/10] Loop & Conditional Mutation: OK -> Verified [5, 15, 50, 70]")

    # 5. Singly Linked List
    ll_code = """
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None
head = Node(1)
head.next = Node(2)
head.next.next = Node(3)
"""
    res3 = post_json("http://127.0.0.1:8000/api/execute", {"code": ll_code})
    assert res3["success"] is True
    final_step_ll = res3["steps"][-1]
    ll_detected = [d for d in final_step_ll["detected_structures"] if d["kind"] == "linked_list"]
    assert len(ll_detected) >= 1, "Linked list not detected"
    vals = [n["val"] for n in ll_detected[0]["payload"]["nodes"]]
    assert vals == [1, 2, 3], f"Linked list node values mismatch: {vals}"
    print("[PASS] [5/10] Singly Linked List Detection & Pointer Traversal: OK -> Nodes [1 -> 2 -> 3]")

    # 6. Binary Tree
    tree_code = """
class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None
root = TreeNode(20)
root.left = TreeNode(10)
root.right = TreeNode(30)
"""
    res4 = post_json("http://127.0.0.1:8000/api/execute", {"code": tree_code})
    assert res4["success"] is True
    tree_detected = [d for d in res4["steps"][-1]["detected_structures"] if d["kind"] == "binary_tree"]
    assert len(tree_detected) >= 1, "Binary tree not detected"
    tree_vals = {n["val"] for n in tree_detected[0]["payload"]["nodes"]}
    assert tree_vals == {20, 10, 30}
    print("[PASS] [6/10] Binary Tree Structure Detection: OK -> Nodes {20, 10, 30}")

    # 7. Recursion Call Stack
    rec_code = """
def fact(n):
    if n <= 1:
        return 1
    return n * fact(n - 1)
ans = fact(3)
"""
    res5 = post_json("http://127.0.0.1:8000/api/execute", {"code": rec_code})
    assert res5["success"] is True
    max_call_depth = max(s["call_depth"] for s in res5["steps"])
    assert max_call_depth >= 3, f"Expected call depth >= 3, got {max_call_depth}"
    assert res5["steps"][-1]["variables"]["ans"]["value"] == 6
    print("[PASS] [7/10] Recursion Call Stack & Frames: OK -> Verified call depth & factorial(3) = 6")

    # 8. Graph Adjacency List
    graph_code = """
g = {"X": ["Y", "Z"], "Y": ["Z"], "Z": []}
"""
    res6 = post_json("http://127.0.0.1:8000/api/execute", {"code": graph_code})
    assert res6["success"] is True
    graph_detected = [d for d in res6["steps"][-1]["detected_structures"] if d["kind"] == "graph"]
    assert len(graph_detected) >= 1
    assert set(graph_detected[0]["payload"]["nodes"]) == {"X", "Y", "Z"}
    print("[PASS] [8/10] Graph Adjacency List: OK -> Vertices {'X', 'Y', 'Z'}")

    # 9. Sandbox Security: Restricted module import
    sec_code = "import os\nos.system('dir')"
    res7 = post_json("http://127.0.0.1:8000/api/execute", {"code": sec_code})
    assert res7["success"] is False, "Restricted import should fail"
    assert "ImportError" in res7["error"], f"Expected ImportError, got {res7['error']}"
    print("[PASS] [9/10] Sandbox Security Isolation: OK -> Blocked unauthorized import")

    # 10. Sandbox Security: Infinite loop timeout
    inf_code = "while True: pass"
    res8 = post_json("http://127.0.0.1:8000/api/execute", {"code": inf_code, "timeout_seconds": 1.5})
    assert res8["success"] is False, "Infinite loop should trigger timeout"
    assert "timed out" in res8["error"].lower(), f"Expected timeout error, got {res8['error']}"
    print("[PASS] [10/10] Sandbox Timeout Enforcement: OK -> Terminated infinite loop safely")

    print("\n================ ALL 10 E2E LIVE TESTS PASSED ================")

if __name__ == "__main__":
    main()
