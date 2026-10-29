import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
repo_root = os.path.abspath(os.path.join(current_dir, ".."))

search_paths = [
    os.path.join(repo_root, "DSA", "frontend", "api"),
    os.path.join(repo_root, "DSA", "backend"),
    os.path.join(repo_root, "backend"),
    repo_root,
]

for p in search_paths:
    if os.path.isdir(p) and p not in sys.path:
        sys.path.insert(0, p)

from app.main import app
