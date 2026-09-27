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

# Mount API Routers
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(patients.router, prefix=api_prefix)
app.include_router(beds.router, prefix=api_prefix)
app.include_router(recommendations.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(alerts.router, prefix=api_prefix)
app.include_router(audit_logs.router, prefix=api_prefix)
app.include_router(simulation.router, prefix=api_prefix)

# WebSocket Router
app.include_router(ws.router)
app.include_router(ws.router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "system": "MediFlow Hospital Resource Management System",
        "status": "Operational",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "disclaimer": "Clinical decision-support prototype. Requires qualified staff verification."
    }
