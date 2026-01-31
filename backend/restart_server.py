#!/usr/bin/env python
"""Quick restart script for testing"""

import subprocess
import sys
import time
from pathlib import Path

backend_dir = Path(__file__).parent

print("=" * 70)
print("🔄 Restarting SMA Sanjeevani Backend with New OCR Logging")
print("=" * 70)
print()

# Change to backend directory
import os
os.chdir(backend_dir)

print("📁 Working directory:", os.getcwd())
print()
print("🚀 Starting server with enhanced OCR logging...")
print("=" * 70)
print()
print("Watch for these log sections:")
print("  1. 🔍 Running OCR engines...")
print("  2. 📄 EXTRACTED TEXT FROM PRESCRIPTION")
print("  3. 📊 Text statistics (length, words, lines)")
print("  4. 🔄 Sending extracted text to LLM...")
print()
print("=" * 70)
print()

# Start server
subprocess.run([sys.executable, "start.py"])
