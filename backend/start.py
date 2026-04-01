#!/usr/bin/env python3
"""
Quick start script for SMA Sanjeevani Backend
Ensures proper environment and starts the application
"""
import sys
import os
from pathlib import Path
import io

# Fix Unicode output encoding for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load environment variables from .env file
try:
    from app.core.env_loader import load_backend_env
    loaded_envs = load_backend_env()
    if loaded_envs:
        print(f"✅ Loaded environment variables from: {', '.join(str(p) for p in loaded_envs)}")
except ImportError:
    print("ℹ️  python-dotenv not installed, skipping env file loading")

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
        reload=False,  # Disable reload to keep server stable during testing
        log_level="info"
    )
