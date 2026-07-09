import os
import json
import re
from fastapi import HTTPException

class ChatAgent:
    def __init__(self, data_dir="backend/data"):
        self.data_dir = data_dir
        self.client = None
        self.knowledge_base = []
        self._build_knowledge_base()
        self._init_gemini()

    def _init_gemini(self):
        """Initializes Gemini API using the official google-genai SDK."""
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            # We require the environment variable to be set for the final app
            print("WARNING: GEMINI_API_KEY environment variable is not set.")
            return

        try:
            from google import genai
            self.client = genai.Client(api_key=api_key)
        except Exception as e:
            print(f"Gemini client initialization failed: {e}")

    def _build_knowledge_base(self):
        """Builds a flat list of text snippets from database files for RAG retrieval."""
        try:
            # 1. Load Stadiums
            stadiums_file = os.path.join(self.data_dir, "stadiums.json")
            if os.path.exists(stadiums_file):
                with open(stadiums_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for s in data["stadiums"]:
                        self.knowledge_base.append({
                            "source": f"Stadium: {s['name']}",
                            "text": f"Stadium {s['name']} is in {s['city']}. Capacity is {s['capacity']}. Address: {s['address']}."
                        })
                        for gate in s["gates"]:
                            self.knowledge_base.append({
                                "source": f"{s['name']} - Gates",
                                "text": f"At {s['name']}, {gate['name']} coordinates are X:{gate['coords']['x']}, Y:{gate['coords']['y']}. Access notes: {gate['accessibility']}. Nearest parking lot: {gate['nearest_parking']}."
                            })
                        self.knowledge_base.append({
                            "source": f"{s['name']} - Accessibility",
                            "text": f"Accessibility services at {s['name']}: Sensory Room is at {s['accessibility_services']['sensory_room']}. Wheelchair rentals are at {s['accessibility_services']['wheelchair_rental']}. Assistive Listening: {s['accessibility_services']['assistive_listening']}."
                        })

            # 2. Load Matches & Rosters
            matches_file = os.path.join(self.data_dir, "matches.json")
            if os.path.exists(matches_file):
                with open(matches_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for m in data["matches"]:
                        match_desc = f"Match {m['id']} is a {m['stage']} game between {m['home_team']['name']} and {m['away_team']['name']} at stadium {m['stadium_id']} on {m['date']} at {m['time']}."
                        self.knowledge_base.append({
                            "source": f"Match {m['id']} Schedule",
                            "text": match_desc
                        })
                        
                        self.knowledge_base.append({
                            "source": f"{m['home_team']['name']} Trivia",
                            "text": f"Team {m['home_team']['name']} coach is {m['home_team']['coach']}. Trivia: {m['home_team']['trivia']}"
                        })
                        for p in m["home_team"]["roster"]:
                            self.knowledge_base.append({
                                "source": f"{m['home_team']['name']} Roster - {p['name']}",
                                "text": f"Player #{p['number']} {p['name']} plays as {p['position']} for {m['home_team']['name']}. Club: {p['club']}. Fact: {p['fact']}"
                            })

                        self.knowledge_base.append({
                            "source": f"{m['away_team']['name']} Trivia",
                            "text": f"Team {m['away_team']['name']} coach is {m['away_team']['coach']}. Trivia: {m['away_team']['trivia']}"
                        })
                        for p in m["away_team"]["roster"]:
                            self.knowledge_base.append({
                                "source": f"{m['away_team']['name']} Roster - {p['name']}",
                                "text": f"Player #{p['number']} {p['name']} plays as {p['position']} for {m['away_team']['name']}. Club: {p['club']}. Fact: {p['fact']}"
                            })

            # 3. Load Concessions/Shops
            shops_file = os.path.join(self.data_dir, "shops.json")
            if os.path.exists(shops_file):
                with open(shops_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for s in data["shops"]:
                        shop_desc = f"Shop {s['name']} is a {s['type']} shop. Eco note: {s['sustainability_note']} (Rating: {s['sustainability_rating']} stars). Locations:"
                        for loc in s["locations"]:
                            stadium_val = loc.get("stadium_id", "metlife")
                            shop_desc += f" [Stadium: {stadium_val} at Section {loc['section']} near {loc['gate']}]"
                        self.knowledge_base.append({
                            "source": f"Shop {s['name']}",
                            "text": shop_desc
                        })
                        for item in s["menu"]:
                            self.knowledge_base.append({
                                "source": f"Shop {s['name']} Menu",
                                "text": f"Shop {s['name']} sells {item['item']} for ${item['price']:.2f}. Description: {item['description']}"
                            })

            # 4. Load Sponsors
            sponsors_file = os.path.join(self.data_dir, "sponsors.json")
            if os.path.exists(sponsors_file):
                with open(sponsors_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for sp in data["sponsors"]:
                        self.knowledge_base.append({
                            "source": f"Sponsor {sp['name']}",
                            "text": f"Sponsor {sp['name']} ({sp['tier']}) logo {sp['logo']} activation: {sp['activation']}. Promotion: {sp['promo']}"
                        })
        except Exception as e:
            print(f"Error building knowledge base: {e}")

    def retrieve(self, query, top_k=5):
        """Standard TF-IDF / Keyword ranking system for RAG retrieval."""
        words = re.findall(r"\w+", query.lower())
        scored_docs = []
        for doc in self.knowledge_base:
            score = 0
            doc_text = doc["text"].lower() + " " + doc["source"].lower()
            for word in words:
                if len(word) > 2:
                    if word in doc_text:
                        score += 1
                        if word in doc["source"].lower():
                            score += 2
            if score > 0:
                scored_docs.append((score, doc))
        
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in scored_docs[:top_k]]

    def answer_query(self, query, ticket_context=None):
        """Generative RAG Q&A using the Gemini API."""
        if not self.client:
            # Try to initialize again just in case the key was set post-launch
            self._init_gemini()
            if not self.client:
                raise HTTPException(
                    status_code=500, 
                    detail="GEMINI_API_KEY is not configured on the server. Please set this environment variable to enable the Generative AI Chatbot."
                )

        retrieved_docs = self.retrieve(query)
        context_str = "\n".join([f"[{d['source']}]: {d['text']}" for d in retrieved_docs])
        
        user_info = "Unknown visitor"
        if ticket_context and ticket_context.get("parsed"):
            user_info = f"Ticket Holder Role: {ticket_context.get('role', 'Fan')}, Section: {ticket_context.get('section', 'N/A')}, Row: {ticket_context.get('row', 'N/A')}, Seat: {ticket_context.get('seat', 'N/A')} at {ticket_context.get('stadium_name', 'MetLife Stadium')}."

        system_prompt = (
            "You are the official FIFA World Cup 2026 Generative AI Assistant, designed to help fans, volunteers, and staff. "
            "Your replies must be strictly grounded in the official database records provided below. "
            "If the retrieved facts do not contain the answer, say 'I cannot find that information in the official tournament guide, but I am happy to help you with routing, tickets, or stadium layout details.' "
            "Do not make up facts or invent details that are not in the provided facts.\n"
            "Answer in the same language as the user's query (e.g. reply in Spanish if they ask in Spanish).\n\n"
            f"User context: {user_info}\n\n"
            f"Official Database Records:\n{context_str}"
        )

        try:
            # Double-Layer Fallback: Try Gemini 3.5 Flash first, then Gemini 2.0 Flash, then local RAG
            try:
                response = self.client.models.generate_content(
                    model='gemini-3.5-flash',
                    contents=query,
                    config={
                        'system_instruction': system_prompt,
                        'temperature': 0.1
                    }
                )
            except Exception as e_flash35:
                print(f"Gemini 3.5 Flash unavailable ({e_flash35}). Trying Gemini 2.0 Flash...")
                response = self.client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=query,
                    config={
                        'system_instruction': system_prompt,
                        'temperature': 0.1
                    }
                )
            
            return {
                "answer": response.text,
                "sources": list(set([d["source"] for d in retrieved_docs])),
                "ai_generated": True
            }
        except Exception as e_fallback:
            print(f"All GenAI models unavailable ({e_fallback}). Falling back to local RAG extraction.")
            
            if not retrieved_docs:
                return {
                    "answer": (
                        "⚠️ *[Local Grounded Fallback Mode]* Google's AI servers are currently experiencing high demand. "
                        "I couldn't find a direct keyword match in our local stadium databases for your question. "
                        "Please try asking about match schedules, stadium gates, accessibility sensory rooms, or concessions!"
                    ),
                    "sources": ["Local Database Fallback"],
                    "ai_generated": False
                }
            
            # Format the matched RAG documents nicely
            facts_list = []
            for score, doc in retrieved_docs[:3]: # top 3 facts
                facts_list.append(f"• **{doc['source']}**: {doc['text']}")
            
            answer_text = (
                "⚠️ *[Local Grounded Fallback Mode]* Google's AI servers are currently experiencing high demand. "
                "Here are the matching official records retrieved directly from our local tournament database:\n\n"
                + "\n".join(facts_list) + "\n\n"
                "*(Please try again in a few moments to connect back to the Cloud GenAI model!)*"
            )
            return {
                "answer": answer_text,
                "sources": list(set([d["source"] for d in retrieved_docs])),
                "ai_generated": False
            }
