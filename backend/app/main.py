"""
SMA Sanjeevani Backend - Main Application Entry Point
"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
import logging

from app.core.config import settings
from app.core.database import init_db
from app.api.routes.routes_auth import router as auth_router
from app.api.routes.routes_dashboard import router as dashboard_router
from app.api.routes.routes_doctors import router as doctors_router
from app.api.routes.routes_appointments import router as appointments_router
from app.api.routes.routes_medicine_history import router as medicine_history_router
from app.api.routes.routes_prescriptions import router as prescriptions_router
from app.api.routes.routes_qa_history import router as qa_history_router
from app.api.routes.routes_reminders import router as reminders_router
from app.api.routes.routes_hospital_reports import router as hospital_reports_router
from app.api.routes.routes_hospital_report_history import router as hospital_report_history_router
from app.api.routes.routes_handwritten_prescriptions import router as handwritten_prescriptions_router
from app.services.symptoms_recommendation import router as symptoms_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Medicine identification (requires cv2 / opencv-python); optional so server starts without it
try:
    from app.api.routes.routes_medicine_identification import router as medicine_identification_router
    HAVE_MEDICINE_IDENTIFICATION = True
    logger.info("✅ Medicine identification service loaded successfully")
except ImportError as e:
    HAVE_MEDICINE_IDENTIFICATION = False
    medicine_identification_router = None
    logger.error(f"❌ Medicine identification disabled: {e}")

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Medical Assistant with Database",
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if not settings.DEBUG else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and responses"""
    # Log incoming request
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        logger.info(f"📨 [{request.method}] {request.url.path} - From: {request.client.host if request.client else 'unknown'}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        logger.info(f"📤 [{request.method}] {request.url.path} - Status: {response.status_code}")
    
    return response


# Custom exception handler for validation errors
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """Handle Pydantic validation errors with detailed messages"""
    logger.error(f"❌ Validation error: {exc}")
    errors = []
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"])
        msg = error["msg"]
        errors.append(f"{field}: {msg}")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": errors,
            "message": "; ".join(errors)
        }
    )


@app.on_event("startup")
async def startup_event():
    """Initialize database and services on application startup"""
    try:
        init_db()
        logger.info("✅ Database initialized successfully")
        
        # Create anonymous user for prescriptions
        try:
            from app.core.database import SessionLocal
            from app.models.models import User
            
            db = SessionLocal()
            anonymous_user = db.query(User).filter(User.id == 0).first()
            
            if not anonymous_user:
                logger.info("🔄 Creating anonymous user for prescriptions...")
                anonymous_user = User(
                    id=0,
                    username="anonymous",
                    email="anonymous@sanjeevani.local",
                    password_hash="disabled",
                    is_active=True
                )
                db.add(anonymous_user)
                db.commit()
                logger.info("✅ Anonymous user created successfully")
            else:
                logger.info("✅ Anonymous user already exists")
            
            db.close()
        except Exception as e:
            logger.warning(f"⚠️ Could not create anonymous user: {e}")
            
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    logger.info("🛑 Application shutting down")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# Include routers
app.include_router(auth_router, tags=["Authentication"])
app.include_router(dashboard_router, tags=["Dashboard"])
app.include_router(doctors_router, tags=["Doctors"])
app.include_router(appointments_router, tags=["Appointments"])
app.include_router(medicine_history_router, tags=["Medicine History"])
app.include_router(prescriptions_router, tags=["Prescriptions"])
app.include_router(hospital_reports_router, tags=["Hospital Reports"])
logger.info("✅ Hospital Report Analyzer router registered")
app.include_router(hospital_report_history_router, tags=["Hospital Report History"])
app.include_router(qa_history_router, tags=["QA History"])
app.include_router(reminders_router, tags=["Reminders"])
if HAVE_MEDICINE_IDENTIFICATION:
    app.include_router(medicine_identification_router, tags=["Medicine Identification"])
    logger.info("✅ Medicine Identification router registered")
else:
    logger.info("ℹ️ Medicine identification feature requires additional dependencies")
app.include_router(symptoms_router, prefix="", tags=["Symptoms & Recommendations"])
app.include_router(handwritten_prescriptions_router, tags=["Handwritten Prescriptions"])
logger.info("✅ Handwritten Prescription Analyzer router registered")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
