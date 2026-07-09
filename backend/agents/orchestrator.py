from typing import Dict, Any, Optional
from backend.agents.ticket_agent import TicketAgent
from backend.agents.nav_agent import NavigationAgent
from backend.agents.chat_agent import ChatAgent
from backend.agents.crowd_agent import CrowdAgent

class OrchestratorAgent:
    """The master orchestrator coordinating ticket parsing, navigation planners, safety sensing, and chatbot queries."""
    
    def __init__(self, data_dir: str = "backend/data") -> None:
        """Initializes all subagents with the specified data database directory.

        Args:
            data_dir (str): Path to directory containing databases.
        """
        self.ticket_agent = TicketAgent(data_dir=data_dir)
        self.nav_agent = NavigationAgent(data_dir=data_dir)
        self.chat_agent = ChatAgent(data_dir=data_dir)
        self.crowd_agent = CrowdAgent()

    def process_ticket(self, filename: str, file_bytes: bytes) -> Dict[str, Any]:
        """Routes uploaded ticket file parsing to PDF or image OCR scanner workflows.

        Args:
            filename (str): Name of uploaded ticket file.
            file_bytes (bytes): Raw file content bytes.

        Returns:
            Dict[str, Any]: Parsed user role and gate coordinates.
        """
        if filename.endswith(".pdf"):
            return self.ticket_agent.parse_pdf_ticket(file_bytes)
        else:
            return self.ticket_agent.parse_image_ticket(filename, file_bytes)

    def get_navigation(self, origin: str, ticket_context: dict) -> Dict[str, Any]:
        """Routes origin and destination coordinates routing queries to the NavigationAgent.

        Args:
            origin (str): User-specified departure address.
            ticket_context (dict): Active ticket details dict.

        Returns:
            Dict[str, Any]: Step-by-step route phases list.
        """
        return self.nav_agent.plan_route(origin, ticket_context)

    def route_chat(self, query: str, ticket_context: Optional[dict] = None) -> Dict[str, Any]:
        """Scans queries, detects intent (Navigation vs Crowd Alerts vs Q&A), and routes to specialized subagents.

        Args:
            query (str): Sanitized prompt text.
            ticket_context (Optional[dict]): User context parameters.

        Returns:
            Dict[str, Any]: Grounded reply text and source details.
        """
        query_lower = query.lower()
        
        # 1. Navigation Intent Check
        nav_keywords = ["how do i get to", "navigation", "route", "where is my seat", "find my section", "directions to"]
        if any(kw in query_lower for kw in nav_keywords) and ticket_context:
            route = self.nav_agent.plan_route("Home", ticket_context)
            indoor_steps = route.get("phases", {}).get("indoor", [])
            steps_desc = " -> ".join([s.get("instruction", "") for s in indoor_steps])
            return {
                "answer": f"Here are your customized indoor directions to seat:\n{steps_desc}\n\nYou can view the step-by-step route and points of interest on the 'Map' tab.",
                "sources": ["Indoor Seating Map Guide"],
                "ai_generated": False
            }

        # 2. Staff/Crowd Intent Check (Only applicable if user is staff/volunteer)
        role = ticket_context.get("role", "Fan") if ticket_context else "Fan"
        if role in ["Staff", "Volunteer"] and any(kw in query_lower for kw in ["crowd", "mishap", "alert", "volunteer", "staff", "heat"]):
            mishaps = self.crowd_agent.list_mishaps()
            active_mishaps = [m for m in mishaps if m.get("status") == "active"]
            if active_mishaps:
                desc = "\n".join([f"- Alert {m['id']} ({m['severity'].upper()}): {m['description']} at {m['location']}" for m in active_mishaps])
                return {
                    "answer": f"Currently, there is 1 active crowd management alert:\n{desc}\n\nResponders can coordinate and mark tasks as resolved in the Volunteer Portal.",
                    "sources": ["Live Crowd Sensors"],
                    "ai_generated": False
                }
            else:
                return {
                    "answer": "All entry gates and concourse paths are currently operating at normal density parameters. No incidents reported.",
                    "sources": ["Live Crowd Sensors"],
                    "ai_generated": False
                }

        # 3. Default to RAG Q&A
        return self.chat_agent.answer_query(query, ticket_context)
