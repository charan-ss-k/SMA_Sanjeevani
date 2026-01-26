from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from features.symptoms_recommendation import router as symptoms_router
from routes_auth import router as auth_router
from routes_medicine_history import router as medicine_history_router
from routes_prescriptions import router as prescriptions_router
from routes_reminders import router as reminders_router
from routes_qa_history import router as qa_history_router
from routes_dashboard import router as dashboard_router
from database import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SMA Sanjeevani Backend", description="AI Medical Assistant with Database")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup"""
    try:
        init_db()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")

# Include routers
app.include_router(symptoms_router, prefix="")
app.include_router(auth_router)
app.include_router(medicine_history_router)
app.include_router(prescriptions_router)
app.include_router(reminders_router)
app.include_router(qa_history_router)
app.include_router(dashboard_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    # Run the FastAPI app directly
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
