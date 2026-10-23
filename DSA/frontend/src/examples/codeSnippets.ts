export interface CodeSnippet {
  id: string;
  name: string;
  category: string;
  code: string;
  description: string;
}

export const CODE_SNIPPETS: CodeSnippet[] = [
  {
    id: 'first-demo',
    name: '1. Array Append & Pop (Master Test)',
    category: 'Arrays',
    description: 'Fundamental demonstration test: array initialization, append(40), and pop(1).',
    code: `arr = [10, 20, 30]
arr.append(40)
arr.pop(1)
print("Final array:", arr)
`,
  },
  {
    id: 'stack-ops',
    name: '2. Stack LIFO (Push & Pop)',
    category: 'Stacks',
    description: 'Stack data structure with push (append) and pop operations.',
    code: `stack = []
stack.append(10)
stack.append(20)
stack.append(30)

# Pop the top element
popped_val = stack.pop()
print("Popped item:", popped_val)
print("Remaining stack:", stack)
`,
  },
  {
    id: 'queue-ops',
    name: '3. Queue FIFO (Enqueue & Dequeue)',
    category: 'Queues',
    description: 'Queue data structure with enqueue (append) and dequeue (pop from front).',
    code: `queue = []
queue.append("Alice")
queue.append("Bob")
queue.append("Charlie")

# Serve the first arrival (FIFO)
served = queue.pop(0)
print("Served:", served)
print("Queue line:", queue)
`,
  },
  {
    id: 'linked-list',
    name: '4. Linked List Insertion',
    category: 'Linked Lists',
    description: 'Insert a new node between existing nodes by rewiring pointer arrows.',
    code: `class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

# Build 10 -> 30
head = Node(10)
head.next = Node(30)

# Create new node 20
new_node = Node(20)

# Step 1: Connect new_node to next node (30)
new_node.next = head.next

# Step 2: Connect previous node (10) to new_node
head.next = new_node

# Traverse list
curr = head
while curr:
    print("Value:", curr.val)
    curr = curr.next
`,
  },
  {
    id: 'binary-tree',
    name: '5. Binary Search Tree Construction',
    category: 'Trees',
    description: 'Custom TreeNode class with left and right child pointers.',
    code: `class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

root = TreeNode(20)
root.left = TreeNode(10)
root.right = TreeNode(30)
root.left.left = TreeNode(5)
root.left.right = TreeNode(15)
root.right.right = TreeNode(35)
`,
  },
  {
    id: 'loop-conditional',
    name: '6. Loop & Conditional Mutation',
    category: 'Arrays',
    description: 'Iterates through array elements and doubles items greater than 15.',
    code: `arr = [5, 15, 25, 35]

for i in range(len(arr)):
    if arr[i] > 15:
        arr[i] = arr[i] * 2

print("Modified array:", arr)
`,
  },
  {
    id: 'bubble-sort',
    name: '7. Bubble Sort (In-Place Swapping)',
    category: 'Sorting',
    description: 'Step-by-step element comparisons and index swaps.',
    code: `arr = [64, 34, 25, 12, 22]
n = len(arr)

for i in range(n):
    for j in range(0, n - i - 1):
        if arr[j] > arr[j + 1]:
            # Swap
            temp = arr[j]
            arr[j] = arr[j + 1]
            arr[j + 1] = temp

print("Sorted array:", arr)
`,
  },
  {
    id: 'recursion-factorial',
    name: '8. Recursion & Call Stack (Factorial)',
    category: 'Recursion',
    description: 'Visualizes recursive function calls, call depth, and frame returns.',
    code: `def factorial(n):
    if n <= 1:
        return 1
    result = n * factorial(n - 1)
    return result

ans = factorial(4)
print("Factorial of 4 is:", ans)
`,
  },
  {
    id: 'graph-adjacency',
    name: '9. Graph Adjacency List',
    category: 'Graphs',
    description: 'Directed graph represented as an adjacency dictionary with nodes and edges.',
    code: `graph = {
    "A": ["B", "C"],
    "B": ["C", "D"],
    "C": ["D"],
    "D": ["A"]
}

nodes_visited = []
for node in graph:
    nodes_visited.append(node)
print("Graph keys:", nodes_visited)
`,
  },
];
