# ⚽ FWC26 Co-Pilot: Smart Fan & Operations Assistant

A premium, containerized companion web application designed for fans, staff, and volunteers attending the **FIFA World Cup 2026** at MetLife and SoFi Stadiums. 

This repository showcases a complete full-stack solution featuring a **FastAPI backend** and a **React (Vite) frontend** integrated with Google Cloud services, advanced RAG routing, and responsive animations.

---

## 🤖 Co-Engineered with Antigravity (Advanced Agentic AI)

This project was built, refactored, and optimized through a collaborative pair-programming partnership with **Antigravity**, an agentic AI coding assistant from Google DeepMind. 
---

## 🚀 Key Features

1.  **Ticket Scanning & RAG Context Initialization:**
    *   Fans upload their ticket (PDF/Image) or select a demo pass.
    *   RAG parses ticket parameters (Gate, Section, Seat, Match, and User Role) to dynamically configure dashboards.
2.  **Grounded Cloud GenAI Chatbot:**
    *   Connects to **Gemini 3.5 Flash** (with fallback to Gemini 2.0 Flash) using the official `google-genai` SDK.
    *   Grounded in local databases of stadium layout gates, concession menus, and brackets.
3.  **Google Maps Directions Routing:**
    *   Plots driving paths from local airports (LAX/EWR) directly to stadium gates.
    *   Securely persists API Keys in local browser memory.
4.  **Live Predictor & Match Polls:**
    *   Interactive fan prediction questions in the sidebar.
    *   Simulates other fans' votes dynamically using a background worker thread.
5.  **Pre-Game Kids Trivia Quiz:**
    *   Engaging quiz game with score metrics and host venue badges to entertain children.
6.  **Accessibility & Safety:**
    *   Step-free path mapping, sensory-friendly room locator, and one-tap emergency SOS dispatch.
    *   Includes **Light, Dark, and High-Contrast Accessibility Themes**.

---

## 🛠️ Tech Stack & Architecture

*   **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide Icons.
*   **Backend:** FastAPI (Python 3.11), Uvicorn, Websockets.
*   **AI Engine:** Google GenAI SDK (`google-genai`), Local RAG databases.

---

## 📦 Local Development Setup

### 1. Configure Keys
Create a `.env` file in the project root:
```env
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Start the Backend Server
```bash
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --port 8000 --reload
```

### 3. Build & Run the Frontend
```bash
cd frontend
npm install
npm run build
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser!

---

## ☁️ Google Cloud Run Deployment

To deploy this application as a single container to Google Cloud Run:

```bash
# 1. Submit build to Container/Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/fifa26-copilot

# 2. Deploy to Cloud Run
gcloud run deploy fifa26-copilot \
  --image gcr.io/YOUR_PROJECT_ID/fifa26-copilot \
  --platform managed \
  --region us-east1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your_api_key_here"
```
