#!/bin/bash
# Installation script for updated dependencies

echo "=== Installing Python Dependencies ==="
echo ""

# Get the python executable
PYTHON="python"

# Check if python exists
if ! command -v $PYTHON &> /dev/null; then
    PYTHON="python3"
fi

if ! command -v $PYTHON &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Using Python: $($PYTHON --version)"
echo ""

# Install required packages
echo "📦 Installing required packages..."
$PYTHON -m pip install --upgrade pip

echo ""
echo "Installing core dependencies..."
$PYTHON -m pip install fastapi uvicorn requests pydantic python-multipart

echo ""
echo "Installing TTS packages (Indic Parler-TTS)..."
$PYTHON -m pip install indic-parler-tts gtts pydub google-cloud-texttospeech

echo ""
echo "Installing Image Processing packages..."
$PYTHON -m pip install opencv-python pillow numpy

echo ""
echo "Installing OCR packages..."
$PYTHON -m pip install easyocr

echo ""
echo "Installing Translation packages..."
$PYTHON -m pip install indic-trans2 google-cloud-translate

echo ""
echo "Installing RAG & Vector Database packages..."
$PYTHON -m pip install faiss-cpu sentence-transformers llama-index pandas

echo ""
echo "Installing Database packages..."
$PYTHON -m pip install sqlalchemy alembic psycopg2-binary

echo ""
echo "Installing Security packages..."
$PYTHON -m pip install python-jose cryptography python-dotenv PyJWT bcrypt

echo ""
echo "✅ Installation completed!"
echo ""
echo "Run the backend with: python start.py"
echo "Run the frontend with: npm start"
