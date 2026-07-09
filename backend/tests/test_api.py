import os
import sys
from fastapi.testclient import TestClient

# Add project root to sys.path so we can import backend packages
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.main import app

client = TestClient(app)

def test_get_matches():
    response = client.get("/api/matches")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0

def test_get_shops():
    response = client.get("/api/shops")
    assert response.status_code == 200
    data = response.json()
    assert "shops" in data
    assert len(data["shops"]) > 0

def test_login_mock():
    # Test valid mock ticket login
    response = client.post("/api/login-mock", json={"ticket_type": "usa-mexico"})
    assert response.status_code == 200
    data = response.json()
    assert data["parsed"] is True
    assert data["role"] == "Fan"
    assert data["stadium_id"] == "metlife"

def test_login_mock_invalid():
    # Test invalid mock ticket
    response = client.post("/api/login-mock", json={"ticket_type": "invalid-selection"})
    assert response.status_code == 400

def test_navigation_endpoint():
    response = client.post("/api/navigation", json={
        "origin": "Home",
        "ticket_context": {
            "stadium_id": "metlife",
            "gate": "Gate A (Verizon Gate)",
            "section": "112",
            "row": "F",
            "seat": "12",
            "accessibility_required": False
        }
    })
    assert response.status_code == 200
    data = response.json()
    assert "phases" in data

def test_polls_endpoints():
    # 1. Fetch polls
    response = client.get("/api/polls")
    assert response.status_code == 200
    polls = response.json()
    assert len(polls) > 0
    poll_id = polls[0]["id"]
    initial_votes = polls[0]["votes"][0]
    
    # 2. Vote on poll
    response = client.post("/api/polls/vote", json={
        "poll_id": poll_id,
        "option_index": 0
    })
    assert response.status_code == 200
    result = response.json()
    assert result["votes"][0] == initial_votes + 1

def test_chatbot_fallback_RAG():
    # Test chatting when Gemini API might be mocked/offline or rate-limited
    response = client.post("/api/chat", json={
        "query": "Where is MetLife Stadium sensory room?",
        "ticket_context": {
            "stadium_name": "MetLife Stadium",
            "city": "East Rutherford",
            "section": "112",
            "row": "F",
            "seat": "12",
            "role": "Fan"
        }
    })
    # Our fallback logic handles exceptions and returns a clean 200 local RAG response!
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources" in data
