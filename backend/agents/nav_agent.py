import os
import json
from typing import Dict, Any, List, Optional

class NavigationAgent:
    """Agent responsible for planning transport routing, perimeter screening, and step-free indoor layouts."""
    
    def __init__(self, data_dir: str = "backend/data") -> None:
        """Initializes the NavigationAgent, pre-caching stadium and concessions layouts.

        Args:
            data_dir (str): Path to database files directory.
        """
        self.data_dir = data_dir
        self.stadiums_cache: List[Dict[str, Any]] = []
        self.shops_cache: List[Dict[str, Any]] = []
        self._load_cache()

    def _load_cache(self) -> None:
        """Loads static JSON database contents into memory cache at startup."""
        try:
            stadiums_path = os.path.join(self.data_dir, "stadiums.json")
            if os.path.exists(stadiums_path):
                with open(stadiums_path, "r", encoding="utf-8") as f:
                    self.stadiums_cache = json.load(f).get("stadiums", [])

            shops_path = os.path.join(self.data_dir, "shops.json")
            if os.path.exists(shops_path):
                with open(shops_path, "r", encoding="utf-8") as f:
                    self.shops_cache = json.load(f).get("shops", [])
        except Exception as e:
            print(f"WARNING: NavigationAgent pre-caching failed: {e}")

    def get_stadium_layout(self, stadium_id: str) -> Optional[Dict[str, Any]]:
        """Looks up a stadium layout blueprint from memory cache.

        Args:
            stadium_id (str): Unique stadium identifier.

        Returns:
            Optional[Dict[str, Any]]: The matching stadium layout details.
        """
        return next((s for s in self.stadiums_cache if s.get("id") == stadium_id), None)

    def plan_route(self, origin: str, ticket_context: dict) -> Dict[str, Any]:
        """Generates a complete door-to-seat navigation route split into Transit, Perimeter, and Indoor stages.

        Args:
            origin (str): User-specified departure origin address.
            ticket_context (dict): Active session ticket parameters.

        Returns:
            Dict[str, Any]: Structured phase instructions, routing coordinates, and nearest concessions.
        """
        stadium_id = ticket_context.get("stadium_id", "metlife")
        stadium_layout = self.get_stadium_layout(stadium_id)
        if not stadium_layout:
            return {"error": "Stadium layout details not found."}

        gate_name = ticket_context.get("gate", "Gate A")
        section = ticket_context.get("section", "112")
        row = ticket_context.get("row", "F")
        seat = ticket_context.get("seat", "12")
        accessibility = ticket_context.get("accessibility_required", False)

        # 1. Transit Phase
        transit_steps = []
        destination_name = stadium_layout.get("name", "World Cup Stadium")
        city = stadium_layout.get("city", "Host City")
        
        # Determine nearest parking lot
        gate_info = next((g for g in stadium_layout.get("gates", []) if gate_name in g.get("name", "") or g.get("name", "") in gate_name), None)
        parking_lot = gate_info.get("nearest_parking", "General Lot") if gate_info else "General Lot"

        transit_steps.append({
            "instruction": f"Start journey from {origin or 'your location'} toward {destination_name} in {city}.",
            "type": "drive",
            "duration_est": "Approx. 45 mins depending on matchday traffic."
        })
        transit_steps.append({
            "instruction": f"Follow stadium routing signs for '{parking_lot}' to secure parking near your gate entrance.",
            "type": "parking",
            "duration_est": "10 mins"
        })

        # 2. Perimeter Walk Phase
        gate_walk_instruction = f"Walk from {parking_lot} towards {gate_name}."
        if accessibility:
            gate_walk_instruction += " Use the step-free access lanes marked with blue indicators."

        perimeter_steps = [
            {
                "instruction": gate_walk_instruction,
                "type": "walk",
                "duration_est": "5-8 mins"
            },
            {
                "instruction": f"Undergo security screening at {gate_name}. Ensure your digital tickets are open in the app.",
                "type": "security",
                "duration_est": "10 mins (average queue)"
            }
        ]

        # 3. Indoor Concourse & Row Phase
        indoor_steps = []
        # Find section coords
        section_info = next((s for s in stadium_layout.get("sections", []) if s.get("id") == section), None)
        level = section_info.get("level", "Lower Bowl") if section_info else "Lower Bowl"
        
        concourse_instruction = f"Upon entering {gate_name}, turn right and proceed along the main concourse to Section {section} ({level})."
        if accessibility:
            concourse_instruction = f"Upon entering {gate_name}, take Elevator Group 1 to the {level} concourse. Walk toward Section {section}."

        indoor_steps.append({
            "instruction": concourse_instruction,
            "type": "walk",
            "coords_start": gate_info.get("coords") if gate_info else {"x": 50, "y": 50},
            "coords_end": section_info.get("coords") if section_info else {"x": 50, "y": 30},
            "duration_est": "3-5 mins"
        })

        indoor_steps.append({
            "instruction": f"Enter Section {section} seating tunnel, locate Row {row}, and proceed to Seat {seat}.",
            "type": "seat",
            "duration_est": "2 mins"
        })

        # Gather points of interest along the way from cached shops
        pois = []
        for shop in self.shops_cache:
            for loc in shop.get("locations", []):
                if loc.get("gate", "").lower() in gate_name.lower() or loc.get("section") == section:
                    pois.append({
                        "name": shop.get("name", ""),
                        "type": shop.get("type", ""),
                        "section": loc.get("section", ""),
                        "coords": loc.get("coords", {"x": 50, "y": 50})
                    })

        return {
            "origin": origin,
            "destination": stadium_layout.get("name", "World Cup Stadium"),
            "parking": parking_lot,
            "accessibility_mode": accessibility,
            "phases": {
                "transit": transit_steps,
                "perimeter": perimeter_steps,
                "indoor": indoor_steps
            },
            "visual_coordinates": {
                "gate": gate_info.get("coords") if gate_info else {"x": 50, "y": 50},
                "section": section_info.get("coords") if section_info else {"x": 50, "y": 30}
            },
            "points_of_interest": pois
        }
