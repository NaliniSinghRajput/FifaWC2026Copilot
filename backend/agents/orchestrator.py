from backend.agents.ticket_agent import TicketAgent
from backend.agents.nav_agent import NavigationAgent
from backend.agents.chat_agent import ChatAgent
from backend.agents.crowd_agent import CrowdAgent

class OrchestratorAgent:
    def __init__(self, data_dir="backend/data"):
        self.ticket_agent = TicketAgent(data_dir=data_dir)
        self.nav_agent = NavigationAgent(data_dir=data_dir)
        self.chat_agent = ChatAgent(data_dir=data_dir)
        self.crowd_agent = CrowdAgent()

    def process_ticket(self, filename, file_bytes):
        """Passes uploaded ticket to TicketAgent."""
        if filename.endswith(".pdf"):
            return self.ticket_agent.parse_pdf_ticket(file_bytes)
        else:
            return self.ticket_agent.parse_image_ticket(filename, file_bytes)

    def get_navigation(self, origin, ticket_context):
        """Passes routing requests to NavAgent."""
        return self.nav_agent.plan_route(origin, ticket_context)

    def route_chat(self, query, ticket_context=None):
        """
        Determines user intent and delegates to specialized agent.
        - If query is about navigation/directions: Suggest routing info or coordinates.
        - If query is about crowd sensing/alerts: Query CrowdAgent (only if staff context).
        - General Q&A: Defer to ChatAgent (RAG).
        """
        query_lower = query.lower()
        
        # 1. Navigation Intent Check
        nav_keywords = ["how do i get to", "navigation", "route", "where is my seat", "find my section", "directions to"]
        if any(kw in query_lower for kw in nav_keywords) and ticket_context:
            route = self.nav_agent.plan_route("Home", ticket_context)
            indoor_steps = route.get("phases", {}).get("indoor", [])
            steps_desc = " -> ".join([s["instruction"] for s in indoor_steps])
            return {
                "answer": f"Here are your customized indoor directions to seat:\n{steps_desc}\n\nYou can view the step-by-step route and points of interest on the 'Map' tab.",
                "sources": ["Indoor Seating Map Guide"],
                "ai_generated": False
            }

        # 2. Staff/Crowd Intent Check (Only applicable if user is staff/volunteer)
        role = ticket_context.get("role", "Fan") if ticket_context else "Fan"
        if role in ["Staff", "Volunteer"] and any(kw in query_lower for kw in ["crowd", "mishap", "alert", "volunteer", "staff", "heat"]):
            mishaps = self.crowd_agent.list_mishaps()
            active_mishaps = [m for m in mishaps if m["status"] == "active"]
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
