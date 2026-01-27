#!/usr/bin/env python3
"""
Quick start script for SMA Sanjeevani Backend
Ensures proper environment and starts the application
"""
import sys
import os
from pathlib import Path

# Ensure we're in the backend directory
backend_dir = Path(__file__).parent
os.chdir(backend_dir)

# Add backend directory to Python path
sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting SMA Sanjeevani Backend...")
    print(f"📁 Working directory: {backend_dir}")
    print(f"🐍 Python version: {sys.version}")
    print("-" * 50)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
