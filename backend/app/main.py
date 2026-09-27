from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.seed_data import seed_database
import app.models # ensure models are registered

# Routers
from app.api import auth, dashboard, patients, beds, recommendations, analytics, alerts, audit_logs, simulation, ws

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

# Ensure database tables and seed data are ready on module load (critical for Vercel serverless cold starts)
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    ## MediFlow — Smart Hospital Bed & Patient Allocation System
    
    A clinical operations platform designed to enhance hospital capacity visibility, 
    streamline patient flow, and recommend suitable beds using explainable deterministic matching.
    
    * **Prototype / Decision-Support Disclaimer**: 
      MediFlow is an operational decision-support tool. It does not replace clinician diagnosis or judgment.
    """,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def debug_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "traceback": traceback.format_exc(), "type": type(exc).__name__}
    )

# Mount API Routers (mounted on both /api and root for Vercel rewrite compatibility)
api_routers = [
    auth.router,
    dashboard.router,
    patients.router,
    beds.router,
    recommendations.router,
    analytics.router,
    alerts.router,
    audit_logs.router,
    simulation.router,
]

for r in api_routers:
    app.include_router(r, prefix=settings.API_V1_STR)
    app.include_router(r, prefix="")

# WebSocket Router
app.include_router(ws.router)
app.include_router(ws.router, prefix=settings.API_V1_STR)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Check for production static frontend dist
base_dir = os.path.dirname(os.path.abspath(__file__))
dist_candidates = [
    os.path.abspath(os.path.join(base_dir, "..", "..", "dist")),
    os.path.abspath(os.path.join(base_dir, "..", "..", "frontend", "dist")),
]
static_dist = next((d for d in dist_candidates if os.path.isdir(d) and os.path.exists(os.path.join(d, "index.html"))), None)

if static_dist:
    assets_dir = os.path.join(static_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    def serve_frontend_root():
        return FileResponse(os.path.join(static_dist, "index.html"))

    @app.get("/favicon.svg")
    def serve_favicon():
        fav = os.path.join(static_dist, "favicon.svg")
        if os.path.exists(fav):
            return FileResponse(fav)
        return FileResponse(os.path.join(static_dist, "index.html"))

    @app.get("/api")
    def root_api():
        return {
            "system": "MediFlow Hospital Resource Management System",
            "status": "Operational",
            "version": settings.VERSION,
            "docs_url": "/docs",
            "disclaimer": "Clinical decision-support prototype. Requires qualified staff verification."
        }

    # Catch-all for SPA client-side routes (e.g. /dashboard, /beds, /admin-login)
    @app.get("/{full_path:path}")
    def serve_spa_routes(full_path: str):
        # Don't intercept API or docs routes
        if full_path.startswith("api") or full_path in ("docs", "redoc", "openapi.json"):
            return {
                "system": "MediFlow Hospital Resource Management System",
                "status": "Operational"
            }
        file_path = os.path.join(static_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dist, "index.html"))
else:
    @app.get("/")
    @app.get("/api")
    def root():
        return {
            "system": "MediFlow Hospital Resource Management System",
            "status": "Operational",
            "version": settings.VERSION,
            "docs_url": "/docs",
            "disclaimer": "Clinical decision-support prototype. Requires qualified staff verification."
        }
