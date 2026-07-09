import random
from typing import Dict, List, Any, Optional

class CrowdAgent:
    """Agent responsible for crowd density heatmaps, volunteer location updates, and safety mishap dispatch."""
    
    def __init__(self) -> None:
        """Initializes the CrowdAgent with simulated shift staff and initial bottleneck alert states."""
        # Coordinates in stadium scale 0 to 100
        # Simulated staff locations
        self.volunteers: List[Dict[str, Any]] = [
            { "id": "v1", "name": "Carlos Gomez", "role": "Gate A Guide", "coords": { "x": 38, "y": 18 }, "active": True },
            { "id": "v2", "name": "Sarah Jenkins", "role": "Section 120 Lead", "coords": { "x": 76, "y": 40 }, "active": True },
            { "id": "v3", "name": "Antoine Dupont", "role": "Concourse Assist", "coords": { "x": 52, "y": 70 }, "active": True },
            { "id": "v4", "name": "Elena Rostova", "role": "First Aid Dispatch", "coords": { "x": 68, "y": 55 }, "active": True }
        ]
        # Active safety mishaps/alerts
        self.mishaps: List[Dict[str, Any]] = [
            {
                "id": "alert_101",
                "severity": "medium",
                "location": "Concourse near Section 120",
                "coords": { "x": 74, "y": 46 },
                "description": "High bottle-neck density forming near Jersey Shore Eats. Crowding level 90%.",
                "status": "active",
                "assigned_to": None
            }
        ]

    def get_crowd_heatmap(self, stadium_id: str) -> List[Dict[str, Any]]:
        """Generates heatmap coordinates and intensity metrics for target stadium layout.

        Args:
            stadium_id (str): Stadium identifier.

        Returns:
            List[Dict[str, Any]]: Heatmap coordinate points.
        """
        # Focus on entrances and major concessions
        if stadium_id == "sofi":
            return [
                { "x": 20, "y": 30, "intensity": 0.8 }, # Entry 1
                { "x": 80, "y": 70, "intensity": 0.9 }, # Entry 7
                { "x": 50, "y": 95, "intensity": 0.4 }, # Entry 10
                { "x": 75, "y": 50, "intensity": 0.85 },# Sec 115 / Tacolandia
                { "x": 42, "y": 23, "intensity": 0.6 }  # Merch Shop
            ]
        else: # metlife
            return [
                { "x": 35, "y": 15, "intensity": 0.95 }, # Gate A (High density)
                { "x": 80, "y": 25, "intensity": 0.6 },  # Gate B
                { "x": 65, "y": 85, "intensity": 0.88 }, # Gate C
                { "x": 15, "y": 70, "intensity": 0.35 }, # Gate D
                { "x": 48, "y": 28, "intensity": 0.9 },  # Jersey Shore Eats Gate A
                { "x": 60, "y": 30, "intensity": 0.75 }  # FIFA Store
            ]

    def list_volunteers(self) -> List[Dict[str, Any]]:
        """Returns active shift volunteers registry list.

        Returns:
            List[Dict[str, Any]]: Volunteer profile items list.
        """
        return self.volunteers

    def update_volunteer_location(self, vol_id: str, coords: Dict[str, float]) -> Optional[Dict[str, Any]]:
        """Registers updated volunteer coordinates on shifts map.

        Args:
            vol_id (str): Unique volunteer ID.
            coords (Dict[str, float]): New X and Y coords.

        Returns:
            Optional[Dict[str, Any]]: Updated volunteer profile or None.
        """
        for v in self.volunteers:
            if v["id"] == vol_id:
                v["coords"] = coords
                return v
        return None

    def list_mishaps(self) -> List[Dict[str, Any]]:
        """Retrieves list of active emergency alerts and bottlenecks.

        Returns:
            List[Dict[str, Any]]: Incident list.
        """
        return self.mishaps

    def report_mishap(self, description: str, coords: Dict[str, float], severity: str = "medium") -> Dict[str, Any]:
        """Creates a new safety incident alert card.

        Args:
            description (str): Detailed text warning description.
            coords (Dict[str, float]): Target incident coordinates.
            severity (str): Priority flag (high, medium, low).

        Returns:
            Dict[str, Any]: Newly created alert item dictionary.
        """
        new_id = f"alert_{random.randint(100, 999)}"
        mishap = {
            "id": new_id,
            "severity": severity,
            "location": f"Coords: {coords.get('x', 50.0)}, {coords.get('y', 50.0)}",
            "coords": coords,
            "description": description,
            "status": "active",
            "assigned_to": None
        }
        self.mishaps.append(mishap)
        return mishap

    def resolve_mishap(self, alert_id: str) -> Optional[Dict[str, Any]]:
        """Marks a reported mishap as resolved.

        Args:
            alert_id (str): Target alert ID.

        Returns:
            Optional[Dict[str, Any]]: Resolved mishap profile or None.
        """
        for m in self.mishaps:
            if m["id"] == alert_id:
                m["status"] = "resolved"
                return m
        return None

    def assign_volunteer(self, alert_id: str, vol_id: str) -> Optional[Dict[str, Any]]:
        """Binds a volunteer dispatcher to resolve an active alert coordinate.

        Args:
            alert_id (str): Target alert ID.
            vol_id (str): Assignee volunteer ID.

        Returns:
            Optional[Dict[str, Any]]: Updated alert profile or None.
        """
        for m in self.mishaps:
            if m["id"] == alert_id:
                m["assigned_to"] = vol_id
                return m
        return None
