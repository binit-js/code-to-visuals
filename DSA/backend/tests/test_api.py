import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_api_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_api_preview(client):
    response = client.post("/api/preview", json={"code": "arr = [1, 2, 3]\nprint(arr)"})
    assert response.status_code == 200
    data = response.json()
    assert data["valid_syntax"] is True
    assert any(s["kind"] == "array" for s in data["structures"])


def test_api_execute(client):
    code = """
arr = [10, 20, 30]
arr.append(40)
arr.pop(1)
print(arr)
"""
    response = client.post("/api/execute", json={"code": code, "max_steps": 500, "timeout_seconds": 3.0})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_steps"] > 0
    assert "[10, 30, 40]" in data["stdout"]


def test_api_feedback(client):
    payload = {
        "category": "complaint",
        "name": "Test User",
        "email": "test@example.com",
        "subject": "Visualizer Arrow Glitch",
        "message": "When reversing a linked list, step 5 pointer points backwards.",
        "rating": 4,
        "current_code": "head = Node(1)",
        "step_info": "Step 5, line 12",
    }
    response = client.post("/api/feedback", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "feedback_id" in data
    assert data["method"] in ["smtp", "web3forms", "saved_locally_and_mailto"]
