# Installation and Testing Script for SMA Sanjeevani with RAG + Translation + Parler-TTS
# Windows PowerShell version - run in Windows PowerShell as Administrator

Write-Host "================================" -ForegroundColor Cyan
Write-Host "SMA Sanjeevani - Full Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Python version
Write-Host "📌 Checking Python version..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
Write-Host "Python: $pythonVersion" -ForegroundColor Green
Write-Host ""

# Navigate to backend
Write-Host "📁 Navigating to backend folder..." -ForegroundColor Yellow
Set-Location -Path "backend" -ErrorAction Stop
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Step 1: Install main dependencies
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "This may take 5-15 minutes depending on your internet speed..." -ForegroundColor Yellow
pip install -r requirements.txt -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install requirements" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Install Parler-TTS from GitHub
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎤 Step 2: Installing Indic Parler-TTS..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Installing from GitHub (this may take a few minutes)..." -ForegroundColor Yellow
pip install git+https://github.com/huggingface/parler-tts.git --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Parler-TTS installed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Parler-TTS installation from GitHub failed" -ForegroundColor Yellow
    Write-Host "ℹ️  This is optional - system will fallback to enhanced TTS" -ForegroundColor Cyan
}
Write-Host ""

# Step 3: Verify cv2 installation
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Step 3: Verifying cv2 (OpenCV) installation..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
python -c "import cv2; print(f'✅ OpenCV version: {cv2.__version__}')" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ OpenCV (cv2) not installed!" -ForegroundColor Red
    Write-Host "Installing opencv-python..." -ForegroundColor Yellow
    pip install opencv-python>=4.8.0 --quiet
    python -c "import cv2; print(f'✅ OpenCV version: {cv2.__version__}')" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ OpenCV installed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  OpenCV installation had issues" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ OpenCV verified" -ForegroundColor Green
}
Write-Host ""

# Step 4: Verify RAG system
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Step 4: Verifying RAG System..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
python -c @"
from app.services.symptoms_recommendation.medicine_rag_system import get_rag_context, MedicineRAGSystem

try:
    context = get_rag_context(['fever'])
    print(f'✅ RAG system working')
    print(f'✅ RAG context length: {len(context)} characters')
    
    rag = MedicineRAGSystem()
    print(f'✅ Medicine knowledge base loaded: {len(rag.knowledge_base)} conditions')
except Exception as e:
    print(f'❌ RAG system error: {e}')
"@
Write-Host ""

# Step 5: Verify Translation Service
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Step 5: Verifying Translation Service..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
python -c @"
from app.services.symptoms_recommendation.translation_service import translation_service, translate_symptoms_to_english

try:
    # Test language detection
    detected = translation_service.detect_language('बुखार')
    print(f'✅ Language detection working: detected "{detected}"')
    
    # Test translation
    english = translate_symptoms_to_english(['बुखार'], 'hindi')
    print(f'✅ Translation working: Hindi "बुखार" → English "{english[0]}"')
    
    print('✅ Translation service ready')
except Exception as e:
    print(f'⚠️  Translation service warning: {e}')
    print('ℹ️  Translation may not work without indic-trans2 or internet')
"@
Write-Host ""

# Step 6: Verify Parler-TTS
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Step 6: Verifying Parler-TTS Service..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
python -c @"
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
"@
Write-Host ""

# Step 7: Verify all imports
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Step 7: Verifying all imports..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
python -c @"
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
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Import verification failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 8: System Status
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📊 System Status" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
python -c @"
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
print('ℹ️  To enable Meditron-7B, set in .env:')
print('  LLM_PROVIDER=ollama')
print('  OLLAMA_URL=http://localhost:11434')
print('  OLLAMA_MODEL=meditron')
"@
Write-Host ""

# Step 9: Ready to start
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ Installation Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Ready to start the system!" -ForegroundColor Green
Write-Host ""
Write-Host "Commands:" -ForegroundColor Cyan
Write-Host "  python start.py           - Start the backend server" -ForegroundColor Yellow
Write-Host "  cd ..\frontend && npm start - Start the frontend (in another terminal)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Testing:" -ForegroundColor Cyan
Write-Host "  System will be available at: http://localhost:5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Features Implemented:" -ForegroundColor Cyan
Write-Host "  ✅ Meditron-7B thinking independently (RAG + enhanced prompt)" -ForegroundColor Green
Write-Host "  ✅ Multi-language support (9 Indic languages)" -ForegroundColor Green
Write-Host "  ✅ 5-step translation pipeline" -ForegroundColor Green
Write-Host "  ✅ Global medicine knowledge base (100+ medicines)" -ForegroundColor Green
Write-Host "  ✅ cv2 error fixed (OpenCV installed)" -ForegroundColor Green
Write-Host "  ✅ Indic Parler-TTS for native language audio" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Run 'python start.py' to start the backend" -ForegroundColor Cyan
