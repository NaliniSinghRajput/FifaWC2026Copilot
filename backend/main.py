import os
import json

# Manually load environment variables from .env file in root if it exists
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(root_dir, ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")
from typing import Dict, List, Optional
from fastapi import FastAPI, File, UploadFile, Form, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.agents.orchestrator import OrchestratorAgent

app = FastAPI(title="FIFA World Cup 2026 Companion API")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve data path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
orchestrator = OrchestratorAgent(data_dir=DATA_DIR)

# --- Pydantic Request Models ---
class MockLoginRequest(BaseModel):
    ticket_type: str  # "usa-mexico", "brazil-england", "volunteer", "staff-ada"

class ChatRequest(BaseModel):
    query: str
    ticket_context: Optional[dict] = None

class NavigationRequest(BaseModel):
    origin: str
    ticket_context: dict

class ReportMishapRequest(BaseModel):
    description: str
    coords: Dict[str, float]
    severity: str = "medium"

class VolunteerLocationUpdate(BaseModel):
    vol_id: str
    coords: Dict[str, float]

class AssignVolunteerRequest(BaseModel):
    alert_id: str
    vol_id: str

# --- Ticket Parsing & Session Endpoints ---
@app.post("/api/login-ticket")
async def login_ticket(file: UploadFile = File(...)):
    """Handles physical/digital ticket upload."""
    content = await file.read()
    filename = file.filename or "ticket.png"
    result = orchestrator.process_ticket(filename, content)
    if not result.get("parsed"):
        raise HTTPException(status_code=400, detail=result.get("error", "Invalid ticket file format."))
    return result

@app.post("/api/login-mock")
async def login_mock(req: MockLoginRequest):
    """Simulates ticket upload for immediate front-page onboarding and testing."""
    tt = req.ticket_type
    if tt == "usa-mexico":
        simulated_text = "Match: 58\nStadium: MetLife Stadium\nGate: Gate A\nSection: 112\nRow: F\nSeat: 12\nRole: Fan"
    elif tt == "brazil-england":
        simulated_text = "Match: 59\nStadium: SoFi Stadium\nGate: Entry 1\nSection: 101\nRow: G\nSeat: 4\nRole: Fan"
    elif tt == "volunteer":
        simulated_text = "Match: 58\nStadium: MetLife Stadium\nGate: Gate B\nSection: 120\nRow: A\nSeat: 1\nRole: Volunteer"
    elif tt == "staff-ada":
        simulated_text = "Match: 58\nStadium: MetLife Stadium\nGate: Gate C\nSection: 132\nRow: ADA\nSeat: 2\nRole: Staff\nAccessibility: Wheelchair ADA"
    else:
        raise HTTPException(status_code=400, detail="Invalid mock ticket selection.")
    
    result = orchestrator.ticket_agent.parse_ticket_text(simulated_text)
    return result

# --- Core Content Endpoints ---
@app.get("/api/matches")
async def get_matches():
    try:
        with open(os.path.join(DATA_DIR, "matches.json"), "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load match schedule: {str(e)}")

@app.get("/api/shops")
async def get_shops():
    try:
        with open(os.path.join(DATA_DIR, "shops.json"), "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load concourse shops: {str(e)}")

@app.get("/api/sponsors")
async def get_sponsors():
    try:
        with open(os.path.join(DATA_DIR, "sponsors.json"), "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load sponsors: {str(e)}")

# --- Agent System Endpoints ---
@app.post("/api/chat")
async def chat(req: ChatRequest):
    """Orchestrates chatbot responses using context RAG."""
    return orchestrator.route_chat(req.query, req.ticket_context)

@app.post("/api/navigation")
async def get_navigation(req: NavigationRequest):
    """Calculates home-to-seat routes."""
    return orchestrator.get_navigation(req.origin, req.ticket_context)

# --- Crowd Sensing & Safety Portal ---
@app.get("/api/crowd/heatmap")
async def get_heatmap(stadium_id: str = "metlife"):
    return orchestrator.crowd_agent.get_crowd_heatmap(stadium_id)

@app.get("/api/crowd/mishaps")
async def get_mishaps():
    return orchestrator.crowd_agent.list_mishaps()

@app.post("/api/crowd/mishaps/report")
async def report_mishap(req: ReportMishapRequest):
    """Reports a crowd bottleneck or a medical emergency."""
    return orchestrator.crowd_agent.report_mishap(req.description, req.coords, req.severity)

@app.post("/api/crowd/mishaps/resolve")
async def resolve_mishap(req: Dict[str, str]):
    alert_id = req.get("alert_id")
    if not alert_id:
        raise HTTPException(status_code=400, detail="alert_id is required.")
    return orchestrator.crowd_agent.resolve_mishap(alert_id)

@app.post("/api/crowd/mishaps/assign")
async def assign_volunteer(req: AssignVolunteerRequest):
    return orchestrator.crowd_agent.assign_volunteer(req.alert_id, req.vol_id)

@app.get("/api/volunteers")
async def list_volunteers():
    return orchestrator.crowd_agent.list_volunteers()

@app.post("/api/volunteers/location")
async def update_location(req: VolunteerLocationUpdate):
    v = orchestrator.crowd_agent.update_volunteer_location(req.vol_id, req.coords)
    if not v:
        raise HTTPException(status_code=404, detail="Volunteer not found.")
    
    # Broadcast updated locations to active sockets if needed
    await manager.broadcast({
        "type": "location_update",
        "vol_id": req.vol_id,
        "coords": req.coords
    })
    return v

# --- Real-Time Coordination WebSockets ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Handle stale sockets
                pass

manager = ConnectionManager()

@app.websocket("/ws/coordinator")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast incoming chat messages or coordinator status
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- Match Predictor & Live Polls Database ---
class PollVote(BaseModel):
    poll_id: str
    option_index: int

polls_db = {
    "1": {
        "id": "1",
        "question": "Who will win Match 58 (USA vs Mexico)?",
        "options": ["USA Win 🇺🇸", "Mexico Win 🇲🇽", "Draw / Penalties"],
        "votes": [1420, 1180, 430]
    },
    "2": {
        "id": "2",
        "question": "Which player will score the first goal?",
        "options": ["Christian Pulisic (USA)", "Hirving Lozano (MEX)", "Weston McKennie (USA)", "Santiago Giménez (MEX)"],
        "votes": [850, 620, 240, 510]
    },
    "3": {
        "id": "3",
        "question": "Live Comm: Will a penalty shootout decide the winner?",
        "options": ["Yes, high pressure!", "No, decided in normal play"],
        "votes": [320, 910]
    }
}

@app.get("/api/polls")
async def get_polls():
    return list(polls_db.values())

@app.post("/api/polls/vote")
async def vote_poll(vote: PollVote):
    pid = vote.poll_id
    opt_idx = vote.option_index
    if pid not in polls_db:
        raise HTTPException(status_code=404, detail="Poll not found.")
    poll = polls_db[pid]
    if opt_idx < 0 or opt_idx >= len(poll["options"]):
        raise HTTPException(status_code=400, detail="Invalid option index.")
    poll["votes"][opt_idx] += 1
    return poll

# --- Serving Frontend SPA in Production ---
frontend_dist = os.path.join(os.path.dirname(BASE_DIR), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
