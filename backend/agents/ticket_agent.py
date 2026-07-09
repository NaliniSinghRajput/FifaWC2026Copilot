import re
import json
import os
from PyPDF2 import PdfReader
from io import BytesIO
from typing import Dict, Any, Tuple, Optional, List

class TicketAgent:
    """Agent responsible for parsing, scanning, and validating physical/digital ticket artifacts."""
    
    def __init__(self, data_dir: str = "backend/data") -> None:
        """Initializes the TicketAgent, pre-caching stadium and match details to prevent disk I/O latency.

        Args:
            data_dir (str): Path to the database files directory.
        """
        self.data_dir = data_dir
        self.stadiums_cache: List[Dict[str, Any]] = []
        self.matches_cache: List[Dict[str, Any]] = []
        self._load_cache()

    def _load_cache(self) -> None:
        """Helper method to load database files into memory cache at startup."""
        try:
            stadiums_path = os.path.join(self.data_dir, "stadiums.json")
            if os.path.exists(stadiums_path):
                with open(stadiums_path, "r", encoding="utf-8") as f:
                    self.stadiums_cache = json.load(f).get("stadiums", [])

            matches_path = os.path.join(self.data_dir, "matches.json")
            if os.path.exists(matches_path):
                with open(matches_path, "r", encoding="utf-8") as f:
                    self.matches_cache = json.load(f).get("matches", [])
        except Exception as e:
            print(f"WARNING: TicketAgent cache loading failed: {e}")

    def load_stadium_and_match(self, match_id: str, stadium_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """Looks up stadium and match details matching given identifiers from memory cache.

        Args:
            match_id (str): Target match identifier.
            stadium_id (str): Target stadium identifier.

        Returns:
            Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]: Retrieved stadium and match details.
        """
        stadium_data = next((s for s in self.stadiums_cache if s.get("id") == stadium_id), None)
        match_data = next((m for m in self.matches_cache if m.get("id") == match_id), None)
        return stadium_data, match_data

    def parse_ticket_text(self, text: str) -> Dict[str, Any]:
        """Parses raw text extracted from a digital ticket and extracts parameters using Regex patterns.

        Args:
            text (str): Raw text content to scan.

        Returns:
            Dict[str, Any]: Structured dictionary containing role, gate, seat details, and validation flag.
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
            for g in stadium_data.get("gates", []):
                if gate.lower() in g.get("name", "").lower():
                    gate_full_name = g.get("name", "")
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

    def parse_pdf_ticket(self, file_bytes: bytes) -> Dict[str, Any]:
        """Extracts text from raw bytes of an uploaded PDF ticket and parses parameters.

        Args:
            file_bytes (bytes): The raw uploaded file bytes.

        Returns:
            Dict[str, Any]: Structured ticket information dict.
        """
        try:
            reader = PdfReader(BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return self.parse_ticket_text(text)
        except Exception as e:
            return {"parsed": False, "error": f"Failed to parse PDF ticket: {str(e)}"}

    def parse_image_ticket(self, filename: str, file_bytes: bytes) -> Dict[str, Any]:
        """Simulates image / QR scanner OCR processing using metadata file matches.

        Args:
            filename (str): Name of uploaded file used for mock triggers.
            file_bytes (bytes): The raw file bytes.

        Returns:
            Dict[str, Any]: Structured ticket details.
        """
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
