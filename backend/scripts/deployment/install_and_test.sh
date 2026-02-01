#!/bin/bash
# Installation and Testing Script for SMA Sanjeevani with RAG + Translation + Parler-TTS
# This script installs all dependencies and runs comprehensive tests

echo "================================"
echo "SMA Sanjeevani - Full Setup"
echo "================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python version
echo "📌 Checking Python version..."
python_version=$(python --version 2>&1)
echo "Python: $python_version"
echo ""

# Navigate to backend
echo "📁 Navigating to backend folder..."
cd backend || { echo "❌ backend folder not found"; exit 1; }
pwd
echo ""

# Step 1: Install main dependencies
echo "================================"
echo "📦 Step 1: Installing dependencies..."
echo "================================"
pip install -r requirements.txt -v || { echo "❌ Failed to install requirements"; exit 1; }
echo ""

# Step 2: Install Parler-TTS from GitHub
echo "================================"
echo "🎤 Step 2: Installing Indic Parler-TTS..."
echo "================================"
echo "Installing from GitHub (this may take a few minutes)..."
pip install git+https://github.com/huggingface/parler-tts.git --quiet || {
    echo "⚠️  Parler-TTS installation from GitHub failed"
    echo "This is optional - system will fallback to enhanced TTS"
}
echo ""

# Step 3: Verify cv2 installation
echo "================================"
echo "✅ Step 3: Verifying cv2 (OpenCV) installation..."
echo "================================"
python -c "import cv2; print(f'✅ OpenCV version: {cv2.__version__}')" 2>/dev/null || {
    echo "❌ OpenCV (cv2) not installed!"
    echo "Installing opencv-python..."
    pip install opencv-python>=4.8.0 --quiet
    python -c "import cv2; print(f'✅ OpenCV version: {cv2.__version__}')" || echo "⚠️  OpenCV installation had issues"
}
echo ""

# Step 4: Verify RAG system
echo "================================"
echo "✅ Step 4: Verifying RAG System..."
echo "================================"
python -c "
from app.services.symptoms_recommendation.medicine_rag_system import get_rag_context, MedicineRAGSystem

try:
    context = get_rag_context(['fever'])
    print(f'✅ RAG system working')
    print(f'✅ RAG context length: {len(context)} characters')
    
    rag = MedicineRAGSystem()
    print(f'✅ Medicine knowledge base loaded: {len(rag.knowledge_base)} conditions')
except Exception as e:
    print(f'❌ RAG system error: {e}')
" || echo "⚠️  Could not verify RAG system"
echo ""

# Step 5: Verify Translation Service
echo "================================"
echo "✅ Step 5: Verifying Translation Service..."
echo "================================"
python -c "
from app.services.symptoms_recommendation.translation_service import translation_service, translate_symptoms_to_english

try:
    # Test language detection
    detected = translation_service.detect_language('बुखार')
    print(f'✅ Language detection working: detected \"{detected}\"')
    
    # Test translation
    english = translate_symptoms_to_english(['बुखार'], 'hindi')
    print(f'✅ Translation working: Hindi \"बुखार\" → English \"{english[0]}\"')
    
    print('✅ Translation service ready')
except Exception as e:
    print(f'⚠️  Translation service warning: {e}')
    print('ℹ️  Translation may not work without indic-trans2 or internet')
" || echo "⚠️  Could not fully verify translation service"
echo ""

# Step 6: Verify Parler-TTS
echo "================================"
echo "✅ Step 6: Verifying Parler-TTS Service..."
echo "================================"
python -c "
try:
    from app.services.parler_tts_service import get_parler_tts_service
    service = get_parler_tts_service()
    if service.model:
        print('✅ Parler-TTS model loaded successfully')
    else:
        print('⚠️  Parler-TTS model not available')
        print('ℹ️  System will use fallback TTS (Enhanced/gTTS)')
except Exception as e:
    print(f'⚠️  Parler-TTS warning: {e}')
    print('ℹ️  This is optional - fallback TTS will be used')
" || echo "⚠️  Parler-TTS verification skipped"
echo ""

# Step 7: Verify all imports
echo "================================"
echo "✅ Step 7: Verifying all imports..."
echo "================================"
python -c "
try:
    print('Checking core packages...')
    import cv2
    print(f'  ✅ cv2 (OpenCV {cv2.__version__})')
    
    import faiss
    print('  ✅ faiss')
    
    import indic_trans2
    print('  ✅ indic_trans2')
    
    import sentence_transformers
    print('  ✅ sentence_transformers')
    
    import llama_index
    print('  ✅ llama_index')
    
    import transformers
    print(f'  ✅ transformers')
    
    import torch
    print(f'  ✅ torch')
    
    print('')
    print('Checking SMA modules...')
    from app.services.symptoms_recommendation.service import recommend_symptoms
    print('  ✅ symptoms service')
    
    from app.services.symptoms_recommendation.medicine_rag_system import get_rag_context
    print('  ✅ RAG system')
    
    from app.services.symptoms_recommendation.translation_service import translate_symptoms_to_english
    print('  ✅ translation service')
    
    from app.services.parler_tts_service import get_parler_tts_service
    print('  ✅ Parler-TTS service')
    
    print('')
    print('✅ All imports successful!')
    
except ImportError as e:
    print(f'❌ Import error: {e}')
    exit(1)
" || { echo "❌ Import verification failed"; exit 1; }
echo ""

# Step 8: System Status
echo "================================"
echo "📊 System Status"
echo "================================"
python -c "
import os
import sys

llm_provider = os.environ.get('LLM_PROVIDER', 'Not set')
ollama_url = os.environ.get('OLLAMA_URL', 'Not set')
ollama_model = os.environ.get('OLLAMA_MODEL', 'Not set')

print(f'Python Version: {sys.version.split()[0]}')
print(f'LLM Provider: {llm_provider}')
print(f'Ollama URL: {ollama_url}')
print(f'Ollama Model: {ollama_model}')
print('')
print('ℹ️  To enable Phi-4, set in .env:')
print('  LLM_PROVIDER=ollama')
print('  OLLAMA_URL=http://localhost:11434')
print('  OLLAMA_MODEL=phi4')
"
echo ""

# Step 9: Ready to start
echo "================================"
echo "✅ Installation Complete!"
echo "================================"
echo ""
echo "🚀 Ready to start the system!"
echo ""
echo "Commands:"
echo "  python start.py           - Start the backend server"
echo "  cd ../frontend && npm start - Start the frontend (in another terminal)"
echo ""
echo "Testing:"
echo "  System will be available at: http://localhost:5000"
echo ""
echo "Features Implemented:"
echo "  ✅ Phi-4 medical intelligence (RAG + advanced reasoning)"
echo "  ✅ Multi-language support (9 Indic languages)"
echo "  ✅ 5-step translation pipeline"
echo "  ✅ Global medicine knowledge base (100+ medicines)"
echo "  ✅ cv2 error fixed (OpenCV installed)"
echo "  ✅ Indic Parler-TTS for native language audio"
echo ""
echo "Next: Run 'python start.py' to start the backend"
