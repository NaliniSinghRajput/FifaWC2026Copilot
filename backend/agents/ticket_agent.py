import re
import json
import os
from PyPDF2 import PdfReader
from io import BytesIO

class TicketAgent:
    def __init__(self, data_dir="backend/data"):
        # Resolve paths relative to project root
        self.data_dir = data_dir
        
    def load_stadium_and_match(self, match_id, stadium_id):
        try:
            with open(os.path.join(self.data_dir, "stadiums.json"), "r", encoding="utf-8") as f:
                stadiums = json.load(f)["stadiums"]
            with open(os.path.join(self.data_dir, "matches.json"), "r", encoding="utf-8") as f:
                matches = json.load(f)["matches"]
        except Exception:
            stadiums = []
            matches = []

        stadium_data = next((s for s in stadiums if s["id"] == stadium_id), None)
        match_data = next((m for m in matches if m["id"] == match_id), None)
        return stadium_data, match_data

    def parse_ticket_text(self, text):
        """
        Parses text extracted from a digital ticket and extracts key parameters using Regex.
        Matches formats like:
        - Match: 58
        - Stadium: MetLife Stadium
        - Gate: Gate A
        - Section: 112
        - Row: F
        - Seat: 12
        - Role: Fan / Volunteer / Staff
        """
        # Look for Match ID
        match_match = re.search(r"Match[:\s]+(\d+)", text, re.IGNORECASE)
        match_id = match_match.group(1) if match_match else "58" # default to USA vs Mexico QF

        # Look for Stadium ID
        stadium_id = "metlife"
        if "sofi" in text.lower() or "los angeles" in text.lower():
            stadium_id = "sofi"

        # Look for Gate
        gate_match = re.search(r"Gate[:\s]+([A-D]|Entry\s+\d+)", text, re.IGNORECASE)
        gate = gate_match.group(1) if gate_match else "Gate A"
        if stadium_id == "sofi" and not gate.startswith("Entry"):
            gate = "Entry 1"

        # Look for Section
        section_match = re.search(r"Section[:\s]+(\d+)", text, re.IGNORECASE)
        section = section_match.group(1) if section_match else "112"

        # Look for Row
        row_match = re.search(r"Row[:\s]+([A-Z\d]+)", text, re.IGNORECASE)
        row = row_match.group(1) if row_match else "F"

        # Look for Seat
        seat_match = re.search(r"Seat[:\s]+(\d+)", text, re.IGNORECASE)
        seat = seat_match.group(1) if seat_match else "12"

        # Look for Role
        role = "Fan"
        if "volunteer" in text.lower():
            role = "Volunteer"
        elif "staff" in text.lower() or "organizer" in text.lower():
            role = "Staff"

        # Look for Accessibility
        accessibility = False
        if "accessibility" in text.lower() or "wheelchair" in text.lower() or "ada" in text.lower():
            accessibility = True

        stadium_data, match_data = self.load_stadium_and_match(match_id, stadium_id)

        # Normalize gate name
        gate_full_name = gate
        if stadium_data:
            for g in stadium_data["gates"]:
                if gate.lower() in g["name"].lower():
                    gate_full_name = g["name"]
                    break

        return {
            "parsed": True,
            "role": role,
            "match_id": match_id,
            "stadium_id": stadium_id,
            "stadium_name": stadium_data["name"] if stadium_data else "World Cup Stadium",
            "city": stadium_data["city"] if stadium_data else "Host City",
            "gate": gate_full_name,
            "section": section,
            "row": row,
            "seat": seat,
            "accessibility_required": accessibility,
            "match_details": {
                "home_team": match_data["home_team"]["name"] if match_data else "Home Team",
                "home_flag": match_data["home_team"]["flag"] if match_data else "⚽",
                "away_team": match_data["away_team"]["name"] if match_data else "Away Team",
                "away_flag": match_data["away_team"]["flag"] if match_data else "⚽",
                "date": match_data["date"] if match_data else "2026-07-10",
                "time": match_data["time"] if match_data else "19:00 EST",
                "stage": match_data["stage"] if match_data else "Quarter-Finals"
            }
        }

    def parse_pdf_ticket(self, file_bytes):
        """Extracts text from uploaded PDF and parses it."""
        try:
            reader = PdfReader(BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return self.parse_ticket_text(text)
        except Exception as e:
            return {"parsed": False, "error": f"Failed to parse PDF ticket: {str(e)}"}

    def parse_image_ticket(self, filename, file_bytes):
        """Mock image/QR code scanner. Parses simulated ticket text from metadata or binary check."""
        # For our challenge, we can scan image names or content.
        # If the file contains text patterns or name metadata matches, we extract it.
        # Fall back to parsed text.
        try:
            # We mock the OCR extraction by looking at the filename or returning a default
            text_simulation = "Match: 58\nStadium: MetLife Stadium\nGate: Gate A\nSection: 112\nRow: F\nSeat: 12\nRole: Fan"
            if "volunteer" in filename.lower():
                text_simulation = "Match: 58\nStadium: MetLife Stadium\nGate: Gate A\nSection: 112\nRow: F\nSeat: 12\nRole: Volunteer"
            elif "staff" in filename.lower() or "admin" in filename.lower():
                text_simulation = "Match: 58\nStadium: MetLife Stadium\nGate: Gate C\nSection: 132\nRow: B\nSeat: 1\nRole: Staff"
            elif "sofi" in filename.lower() or "match12" in filename.lower() or "match59" in filename.lower():
                text_simulation = "Match: 59\nStadium: SoFi Stadium\nGate: Entry 1\nSection: 101\nRow: G\nSeat: 4\nRole: Fan"
            elif "ada" in filename.lower() or "access" in filename.lower() or "wheelchair" in filename.lower():
                text_simulation = "Match: 58\nStadium: MetLife Stadium\nGate: Gate A\nSection: 112\nRow: F\nSeat: 12\nRole: Fan\nAccessibility: Wheelchair ADA"
                
            return self.parse_ticket_text(text_simulation)
        except Exception as e:
            return {"parsed": False, "error": f"Failed to parse Image ticket: {str(e)}"}
