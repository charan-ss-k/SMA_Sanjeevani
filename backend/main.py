from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .features.symptoms_recommendation import router as symptoms_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="SMA Sanjeevani Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(symptoms_router, prefix="")


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
