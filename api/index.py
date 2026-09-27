import os
import sys

# Ensure backend package can be imported by Vercel serverless function runner
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Configure Vercel serverless environment defaults
if "VERCEL" in os.environ and not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:////tmp/mediflow.db"

from app.main import app

# Vercel looks for the ASGI/WSGI entry point variable named `app`
__all__ = ["app"]
