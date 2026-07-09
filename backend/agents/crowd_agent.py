import random

class CrowdAgent:
    def __init__(self):
        # Coordinates in stadium scale 0 to 100
        # Simulated staff locations
        self.volunteers = [
            { "id": "v1", "name": "Carlos Gomez", "role": "Gate A Guide", "coords": { "x": 38, "y": 18 }, "active": True },
            { "id": "v2", "name": "Sarah Jenkins", "role": "Section 120 Lead", "coords": { "x": 76, "y": 40 }, "active": True },
            { "id": "v3", "name": "Antoine Dupont", "role": "Concourse Assist", "coords": { "x": 52, "y": 70 }, "active": True },
            { "id": "v4", "name": "Elena Rostova", "role": "First Aid Dispatch", "coords": { "x": 68, "y": 55 }, "active": True }
        ]
        # Active safety mishaps/alerts
        self.mishaps = [
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

    def get_crowd_heatmap(self, stadium_id):
        """Generates mock heatmap points [x, y, intensity] for the stadium."""
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

    def list_volunteers(self):
        return self.volunteers

    def update_volunteer_location(self, vol_id, coords):
        for v in self.volunteers:
            if v["id"] == vol_id:
                v["coords"] = coords
                return v
        return None

    def list_mishaps(self):
        return self.mishaps

    def report_mishap(self, description, coords, severity="medium"):
        new_id = f"alert_{random.randint(100, 999)}"
        mishap = {
            "id": new_id,
            "severity": severity,
            "location": f"Coords: {coords['x']}, {coords['y']}",
            "coords": coords,
            "description": description,
            "status": "active",
            "assigned_to": None
        }
        self.mishaps.append(mishap)
        return mishap

    def resolve_mishap(self, alert_id):
        for m in self.mishaps:
            if m["id"] == alert_id:
                m["status"] = "resolved"
                return m
        return None

    def assign_volunteer(self, alert_id, vol_id):
        for m in self.mishaps:
            if m["id"] == alert_id:
                m["assigned_to"] = vol_id
                return m
        return None
