import os
from google import genai

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    # Try to load from .env manually
    root_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(root_dir, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip().strip('"').strip("'")
    api_key = os.environ.get("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)
try:
    print("Listing models:")
    for model in client.models.list():
        print(f"Name: {model.name}, Actions: {model.supported_actions}")
except Exception as e:
    print(f"Error listing models: {e}")
