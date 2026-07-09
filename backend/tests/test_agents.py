import os
import sys

# Add project root to sys.path so we can import backend packages
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.agents.ticket_agent import TicketAgent
from backend.agents.nav_agent import NavigationAgent
from backend.agents.chat_agent import ChatAgent

def test_ticket_agent_parsing():
    agent = TicketAgent(data_dir="backend/data")
    ticket_text = "Match: 58\nStadium: MetLife Stadium\nGate: Gate A\nSection: 112\nRow: F\nSeat: 12\nRole: Fan"
    profile = agent.parse_ticket_text(ticket_text)
    
    assert profile["parsed"] is True
    assert profile["role"] == "Fan"
    assert profile["match_id"] == "58"
    assert profile["stadium_id"] == "metlife"
    assert profile["section"] == "112"
    assert profile["row"] == "F"
    assert profile["seat"] == "12"
    assert profile["match_details"]["home_team"] == "USA"

def test_nav_agent_routing():
    agent = NavigationAgent(data_dir="backend/data")
    ticket_context = {
        "stadium_id": "metlife",
        "gate": "Gate A (Verizon Gate)",
        "section": "112",
        "row": "F",
        "seat": "12",
        "accessibility_required": False
    }
    route = agent.plan_route("Home", ticket_context)
    
    assert "phases" in route
    assert "transit" in route["phases"]
    assert "perimeter" in route["phases"]
    assert "indoor" in route["phases"]
    assert len(route["phases"]["transit"]) > 0
    assert route["visual_coordinates"]["gate"] == {"x": 35, "y": 15}

def test_chat_agent_retrieval():
    agent = ChatAgent(data_dir="backend/data")
    docs = agent.retrieve("Christian Pulisic")
    
    # Verify that it retrieves Christian Pulisic matching document snippets
    assert len(docs) > 0
    assert any("Pulisic" in d["text"] for d in docs)
