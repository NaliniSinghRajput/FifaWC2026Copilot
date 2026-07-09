# FIFA World Cup 2026 Companion Web Application

A premium, multi-agentic web application built for fans, volunteers, and operational staff attending the FIFA World Cup 2026. This app is designed for deployment on **Google Cloud Run** and leverages **Generative AI** for crowd sensing, smart navigation, accessibility optimization, and RAG-based query responses.

## 🚀 Key Features

1. **Ticket Scanning & RAG Context Initialization:**
   * Fans upload their ticket (PDF/Image) or select a demo pass.
   * RAG parses ticket parameters (Gate, Section, Seat, Match, and User Role).
   * Dynamically curates a customized dashboard based on their specific match.
2. **All-in-One Navigation Assistant:**
   * Outer transit route mapping from user location to stadium parking lot.
   * Perimeter walk guide from parking lot to security and allotted gate.
   * Custom indoor seating visualizer (animated SVG path mapping from Gate to Section and Row).
   * **Accessibility Mode:** Re-calculates step-free paths, escalators, sensory-friendly rooms, and elevators for wheelchair visitors.
3. **Concourse Directory, Menus, and Sustainability:**
   * Lists all open stadium concessions, first aid stations, and sustainability hubs.
   * Access menus and pricing.
   * **Sustainability gamification:** Earn "Green Points" for green transit and recycling plastic bottles, redeemable for discounts.
4. **Staff & Volunteer Coordination Portal:**
   * Real-time crowd sensor heatmaps.
   * Coordiation intercom & WebSocket-based messaging.
   * Live coordinate sharing to locate and navigate to other staff members.
   * Safety/medical bottleneck alert tickers.
5. **One-Tap SOS Dispatch:**
   * Broadcasts coordinates instantly to emergency crews.
   * Plots responders' route directly to your seat.
6. **Pre-Game Trivia Quiz:**
   * Keeps kids and fans engaged in the "FIFA Universe" with questions based on host venues, rosters, and rules.

---

## 🛠️ Tech Stack & Architecture

*   **Frontend:** React + Vite + Tailwind CSS + Lucide Icons (supports Light, Dark, and High-Contrast Accessibility Themes).
*   **Backend:** FastAPI (Python 3.11) + WebSocket Server + PyPDF2.
*   **AI Engine:** Google Gemini API (`google-genai` SDK) utilizing cloud-hosted grounding databases (`stadiums.json`, `matches.json`, `shops.json`, `sponsors.json`).

---

## 📦 Local Development Setup

### 1. Backend Server Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Set your Cloud Gemini API Key:
   * **Windows (PowerShell):** `$env:GEMINI_API_KEY="your-api-key-here"`
   * **macOS/Linux:** `export GEMINI_API_KEY="your-api-key-here"`
3. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 2. Frontend Web Setup
1. In a separate terminal tab, navigate to the frontend folder:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open [http://localhost:5173](http://localhost:5173) in your browser. All requests to `/api` and `/ws` are automatically proxied to the FastAPI server at `localhost:8000`.

---

## ☁️ Google Cloud Run Deployment

To deploy this application as a single container to Google Cloud Run:

1. **Submit the build to Google Container Registry (GCR) / Artifact Registry:**
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/fifa26-copilot
   ```

2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy fifa26-copilot \
     --image gcr.io/YOUR_PROJECT_ID/fifa26-copilot \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars GEMINI_API_KEY="your-api-key-here"
   ```

3. Copy the secure HTTPS URL provided by Cloud Run and access the application globally!
