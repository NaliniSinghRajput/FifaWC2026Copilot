# ==========================================
# Stage 1: Build the React + Vite Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend config and package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build assets
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Build the FastAPI Python Backend
# ==========================================
FROM python:3.11-slim AS backend-runner
WORKDIR /app

# Install system dependencies if any are needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application source
COPY backend/ ./backend/

# Copy built frontend assets from Stage 1 into the location expected by FastAPI
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose Cloud Run default port
EXPOSE 8080
ENV PORT=8080

# Command to run uvicorn server pointing to fastapi main entry point
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
