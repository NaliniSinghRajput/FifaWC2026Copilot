import os
import json

class NavigationAgent:
    def __init__(self, data_dir="backend/data"):
        self.data_dir = data_dir

    def get_stadium_layout(self, stadium_id):
        try:
            with open(os.path.join(self.data_dir, "stadiums.json"), "r", encoding="utf-8") as f:
                stadiums = json.load(f)["stadiums"]
            return next((s for s in stadiums if s["id"] == stadium_id), None)
        except Exception:
            return None

    def plan_route(self, origin, ticket_context):
        """
        Generates step-by-step navigation directions:
        1. Transit (Origin to Stadium Parking)
        2. Perimeter Walk (Parking to Gate)
        3. Indoor Path (Gate to Seat Section)
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
        destination_name = stadium_layout["name"]
        city = stadium_layout["city"]
        
        # Determine nearest parking lot
        gate_info = next((g for g in stadium_layout["gates"] if gate_name in g["name"] or g["name"] in gate_name), None)
        parking_lot = gate_info["nearest_parking"] if gate_info else "General Lot"

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
        section_info = next((s for s in stadium_layout["sections"] if s["id"] == section), None)
        level = section_info["level"] if section_info else "Lower Bowl"
        
        concourse_instruction = f"Upon entering {gate_name}, turn right and proceed along the main concourse to Section {section} ({level})."
        if accessibility:
            concourse_instruction = f"Upon entering {gate_name}, take Elevator Group 1 to the {level} concourse. Walk toward Section {section}."

        indoor_steps.append({
            "instruction": concourse_instruction,
            "type": "walk",
            "coords_start": gate_info["coords"] if gate_info else {"x": 50, "y": 50},
            "coords_end": section_info["coords"] if section_info else {"x": 50, "y": 30},
            "duration_est": "3-5 mins"
        })

        indoor_steps.append({
            "instruction": f"Enter Section {section} seating tunnel, locate Row {row}, and proceed to Seat {seat}.",
            "type": "seat",
            "duration_est": "2 mins"
        })

        # Gather points of interest along the way (concessions near the section/gate)
        pois = []
        try:
            with open(os.path.join(self.data_dir, "shops.json"), "r", encoding="utf-8") as f:
                shops = json.load(f)["shops"]
            for shop in shops:
                for loc in shop["locations"]:
                    if loc["gate"].lower() in gate_name.lower() or loc["section"] == section:
                        pois.append({
                            "name": shop["name"],
                            "type": shop["type"],
                            "section": loc["section"],
                            "coords": loc["coords"]
                        })
        except Exception:
            pass

        return {
            "origin": origin,
            "destination": stadium_layout["name"],
            "parking": parking_lot,
            "accessibility_mode": accessibility,
            "phases": {
                "transit": transit_steps,
                "perimeter": perimeter_steps,
                "indoor": indoor_steps
            },
            "visual_coordinates": {
                "gate": gate_info["coords"] if gate_info else {"x": 50, "y": 50},
                "section": section_info["coords"] if section_info else {"x": 50, "y": 30}
            },
            "points_of_interest": pois
        }
