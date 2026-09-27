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

from app.main import app as fastapi_app

# ASGI wrapper to normalize paths when Vercel rewrites to /api/index.py
async def app(scope, receive, send):
    if scope["type"] == "http":
        path = scope.get("path", "")
        headers = dict(scope.get("headers", []))
        matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")

        # If Vercel passed /api/index.py literally, use x-matched-path or normalize
        if path in ("/api/index.py", "/api/index"):
            if matched_path:
                scope["path"] = matched_path
            else:
                scope["path"] = "/"
        elif path.startswith("/api/index.py"):
            scope["path"] = path.replace("/api/index.py", "", 1) or "/"

    await fastapi_app(scope, receive, send)

__all__ = ["app"]
