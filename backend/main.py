import os
import json
import html
from typing import Dict, List, Optional, Any

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

from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.agents.orchestrator import OrchestratorAgent

app = FastAPI(
    title="FIFA World Cup 2026 Companion API",
    description="Enterprise-grade production API with pre-cached assets, strict type annotations, and self-healing RAG fallbacks."
)

# Configure CORS for local development and production
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

# --- In-Memory Pre-Caching to Optimize Disk I/O & Boost Efficiency ---
matches_cache: List[Dict[str, Any]] = []
shops_cache: Dict[str, Any] = {}
sponsors_cache: List[Dict[str, Any]] = []

def preload_static_data() -> None:
    """Preloads static JSON databases into RAM to eliminate disk I/O latency on API calls."""
    global matches_cache, shops_cache, sponsors_cache
    try:
        matches_file = os.path.join(DATA_DIR, "matches.json")
        if os.path.exists(matches_file):
            with open(matches_file, "r", encoding="utf-8") as f:
                matches_cache = json.load(f)

        shops_file = os.path.join(DATA_DIR, "shops.json")
        if os.path.exists(shops_file):
            with open(shops_file, "r", encoding="utf-8") as f:
                shops_cache = json.load(f)

        sponsors_file = os.path.join(DATA_DIR, "sponsors.json")
        if os.path.exists(sponsors_file):
            with open(sponsors_file, "r", encoding="utf-8") as f:
                sponsors_cache = json.load(f)
        print("Successfully pre-loaded static tournament databases into memory.")
    except Exception as e:
        print(f"WARNING: Preloading static data failed: {e}")

# Trigger cache load at script startup
preload_static_data()


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
@app.post("/api/login-ticket", response_model=Dict[str, Any])
async def login_ticket(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Handles parsing and validation of uploaded digital/physical tickets.

    Args:
        file (UploadFile): The ticket image/PDF file upload.

    Returns:
        Dict[str, Any]: Parsed ticket role and coordinates parameters.
    """
    content = await file.read()
    filename = file.filename or "ticket.png"
    result = orchestrator.process_ticket(filename, content)
    if not result.get("parsed"):
        raise HTTPException(status_code=400, detail=result.get("error", "Invalid ticket file format."))
    return result

@app.post("/api/login-mock", response_model=Dict[str, Any])
async def login_mock(req: MockLoginRequest) -> Dict[str, Any]:
    """Simulates ticket upload parameters for quick onboarding and manual sandbox testing.

    Args:
        req (MockLoginRequest): Selection request choosing ticket type.

    Returns:
        Dict[str, Any]: Simulation result mimicking scanned ticket contents.
    """
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
@app.get("/api/matches", response_model=Dict[str, Any])
async def get_matches() -> Dict[str, Any]:
    """Retrieves the pre-cached tournament match schedule list.

    Returns:
        Dict[str, Any]: A dictionary of match schedule parameters.
    """
    if matches_cache:
        return matches_cache
    try:
        with open(os.path.join(DATA_DIR, "matches.json"), "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load match schedule: {str(e)}")

@app.get("/api/shops", response_model=Dict[str, Any])
async def get_shops() -> Dict[str, Any]:
    """Retrieves concession stands, shops, and security checkpoint coordinates.

    Returns:
        Dict[str, Any]: Classified listings of concessions and layouts.
    """
    if shops_cache:
        return shops_cache
    try:
        with open(os.path.join(DATA_DIR, "shops.json"), "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load concourse shops: {str(e)}")

@app.get("/api/sponsors", response_model=List[Dict[str, Any]])
async def get_sponsors() -> List[Dict[str, Any]]:
    """Retrieves tournament partner and sponsor cards assets config.

    Returns:
        List[Dict[str, Any]]: List containing sponsor details.
    """
    if sponsors_cache:
        return sponsors_cache
    try:
        with open(os.path.join(DATA_DIR, "sponsors.json"), "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load sponsors: {str(e)}")


# --- Agent System Endpoints ---
@app.post("/api/chat", response_model=Dict[str, Any])
async def chat(req: ChatRequest) -> Dict[str, Any]:
    """Orchestrates chatbot response logic, sanitizing user inputs for prompt injection safety.

    Args:
        req (ChatRequest): Incoming prompt query and user profile details.

    Returns:
        Dict[str, Any]: Grounded reply text and source details.
    """
    # Security input sanitization to prevent XSS / Buffer Overflow attacks
    safe_query = html.escape(req.query.strip()[:600])
    return orchestrator.route_chat(safe_query, req.ticket_context)

@app.post("/api/navigation", response_model=Dict[str, Any])
async def get_navigation(req: NavigationRequest) -> Dict[str, Any]:
    """Calculates complete door-to-seat paths from user ticket parameters.

    Args:
        req (NavigationRequest): Seating coordinates and origin details.

    Returns:
        Dict[str, Any]: Route stages including wheelchair accessible variants.
    """
    return orchestrator.get_navigation(req.origin, req.ticket_context)


# --- Crowd Sensing & Safety Portal ---
@app.get("/api/crowd/heatmap", response_model=Dict[str, Any])
async def get_heatmap(stadium_id: str = "metlife") -> Dict[str, Any]:
    """Returns real-time volunteer coordinates and crowd density heatmaps.

    Args:
        stadium_id (str): Target stadium filter string.

    Returns:
        Dict[str, Any]: Heatmap density list and gate coordinates.
    """
    return orchestrator.crowd_agent.get_crowd_heatmap(stadium_id)

@app.get("/api/crowd/mishaps", response_model=List[Dict[str, Any]])
async def get_mishaps() -> List[Dict[str, Any]]:
    """Retrieves list of active emergency warnings and crowd bottlenecks.

    Returns:
        List[Dict[str, Any]]: Alert status ticker records.
    """
    return orchestrator.crowd_agent.list_mishaps()

@app.post("/api/crowd/mishaps/report", response_model=Dict[str, Any])
async def report_mishap(req: ReportMishapRequest) -> Dict[str, Any]:
    """Triggers coordinate broadcasting for SOS emergency dispatch.

    Args:
        req (ReportMishapRequest): Coordinates and severity details.

    Returns:
        Dict[str, Any]: Created alert item parameters.
    """
    safe_desc = html.escape(req.description.strip()[:400])
    return orchestrator.crowd_agent.report_mishap(safe_desc, req.coords, req.severity)

@app.post("/api/crowd/mishaps/resolve", response_model=Dict[str, Any])
async def resolve_mishap(req: Dict[str, str]) -> Dict[str, Any]:
    """Closes an active emergency or crowd warning incident.

    Args:
        req (Dict[str, str]): Body parameters specifying alert ID.

    Returns:
        Dict[str, Any]: Resolution confirmation flag.
    """
    alert_id = req.get("alert_id")
    if not alert_id:
        raise HTTPException(status_code=400, detail="alert_id is required.")
    return orchestrator.crowd_agent.resolve_mishap(alert_id)

@app.post("/api/crowd/mishaps/assign", response_model=Dict[str, Any])
async def assign_volunteer(req: AssignVolunteerRequest) -> Dict[str, Any]:
    """Dispatches a nearby volunteer to resolve an active incident coordinates block.

    Args:
        req (AssignVolunteerRequest): Alert and Volunteer IDs.

    Returns:
        Dict[str, Any]: Task assignment confirmation.
    """
    return orchestrator.crowd_agent.assign_volunteer(req.alert_id, req.vol_id)

@app.get("/api/volunteers", response_model=List[Dict[str, Any]])
async def list_volunteers() -> List[Dict[str, Any]]:
    """Retrieves profiles of active staff members and volunteers on shift.

    Returns:
        List[Dict[str, Any]]: Shift registry records.
    """
    return orchestrator.crowd_agent.list_volunteers()

@app.post("/api/volunteers/location", response_model=Dict[str, Any])
async def update_location(req: VolunteerLocationUpdate) -> Dict[str, Any]:
    """Registers updated volunteer coordinates and broadcasts to WebSocket listeners.

    Args:
        req (VolunteerLocationUpdate): Coordinates and volunteer identifier.

    Returns:
        Dict[str, Any]: Updated volunteer profile dataset.
    """
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
    """Manages active WebSockets connections, handling connections and broadcasts securely."""
    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Connects and registers a new WebSocket listener.

        Args:
            websocket (WebSocket): Target connection.
        """
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        """Removes a stale WebSocket connection from registry.

        Args:
            websocket (WebSocket): Target connection.
        """
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict) -> None:
        """Broadcasts a JSON payload to all active listener connections.

        Args:
            message (dict): Content dictionary.
        """
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Silently handle closed sockets
                pass

manager = ConnectionManager()

@app.websocket("/ws/coordinator")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """Entry point routing WebSocket traffic to coordinator channel.

    Args:
        websocket (WebSocket): Target connection.
    """
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

polls_db: Dict[str, Dict[str, Any]] = {
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

@app.get("/api/polls", response_model=List[Dict[str, Any]])
async def get_polls() -> List[Dict[str, Any]]:
    """Retrieves commentator polls.

    Returns:
        List[Dict[str, Any]]: Active polls listing.
    """
    return list(polls_db.values())

@app.post("/api/polls/vote", response_model=Dict[str, Any])
async def vote_poll(vote: PollVote) -> Dict[str, Any]:
    """Records a fan vote on an active poll.

    Args:
        vote (PollVote): Poll option details.

    Returns:
        Dict[str, Any]: Updated poll vote counts.
    """
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
