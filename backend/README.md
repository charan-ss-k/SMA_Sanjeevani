# SMA Sanjeevani - Symptoms Recommendation Backend

AI-powered health assistant providing personalized medicine recommendations for rural healthcare.

## Features

- ✅ Symptom-based health condition prediction
- ✅ Safe, OTC medicine recommendations with dosage
- ✅ Home care advice
- ✅ Multi-language support (English, Hindi, Telugu, Tamil, Bengali)
- ✅ Voice-based output (TTS)
- ✅ Safety filtering (blocks antibiotics, opioids, steroids)
- ✅ Pregnancy & allergy awareness

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure LLM Provider

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

**Option A: Use Mock Provider (for testing, no setup required)**

```bash
# In .env
LLM_PROVIDER=mock
```

Then run:

```bash
cd ..  # Go to project root
python -m uvicorn backend.main:app --reload --port 8000
```

**Option B: Use Mistral-7B via Ollama (recommended for production)**

First, install and start Ollama:

1. Download Ollama from [ollama.ai](https://ollama.ai)
2. Start Ollama service:
   ```bash
   ollama serve
   ```
3. In a new terminal, pull Mistral model:
   ```bash
   ollama pull mistral
   ```

Then update `.env`:

```bash
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

Start backend:

```bash
cd "D:\GitHub 2\SMA_Sanjeevani"
python -m uvicorn backend.main:app --reload --port 8000
```

### 3. Test the API

**Health Check:**

```bash
curl http://127.0.0.1:8000/health
```

**Test Symptom Recommendation:**

```bash
curl -X POST http://127.0.0.1:8000/api/symptoms/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "age": 28,
    "gender": "male",
    "symptoms": ["fever", "headache", "body pain"],
    "allergies": ["penicillin"],
    "existing_conditions": ["diabetes"],
    "pregnancy_status": false,
    "language": "english"
  }'
```

## Project Structure

```
backend/
├── main.py                          # FastAPI app entry point
├── requirements.txt                 # Dependencies
├── .env.example                     # Environment variables template
└── features/
    └── symptoms_recommendation/
        ├── __init__.py
        ├── models.py               # Pydantic schemas
        ├── router.py               # FastAPI route
        ├── service.py              # Business logic
        ├── prompt_templates.py     # LLM prompt
        ├── safety_rules.py         # Medicine filtering
        └── utils.py                # Helpers
```

## API Endpoint

### POST `/api/symptoms/recommend`

**Request:**

```json
{
  "age": 28,
  "gender": "male",
  "symptoms": ["fever", "headache", "body pain"],
  "allergies": ["penicillin"],
  "existing_conditions": ["diabetes"],
  "pregnancy_status": false,
  "language": "english"
}
```

**Response:**

```json
{
  "predicted_condition": "Viral Fever",
  "recommended_medicines": [
    {
      "name": "Paracetamol 500mg",
      "dosage": "1 tablet morning and night",
      "duration": "3 days",
      "instructions": "Take after food",
      "warnings": ["Do not exceed 3 tablets/day"]
    }
  ],
  "home_care_advice": [
    "Drink plenty of fluids",
    "Take adequate rest"
  ],
  "doctor_consultation_advice": "If fever persists for more than 3 days, consult a doctor.",
  "disclaimer": "This is not a medical diagnosis. Consult a doctor for serious symptoms.",
  "tts_payload": "Take one Paracetamol tablet in the morning and one at night after food..."
}
```

## Configuration

Edit `.env` to customize:

```env
# LLM Provider: "mock" or "ollama"
LLM_PROVIDER=mock

# Ollama settings
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# LLM parameters (lower temp = more deterministic)
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=1024
```

## Troubleshooting

### "Cannot connect to Ollama"

- Make sure Ollama is running: `ollama serve` in a separate terminal
- Verify model is installed: `ollama list` (should show `mistral`)
- Check URL in .env matches Ollama's binding

### "ModuleNotFoundError: No module named 'features'"

- Make sure you're running from project root:
  ```bash
  cd "D:\GitHub 2\SMA_Sanjeevani"
  python -m uvicorn backend.main:app --port 8000
  ```

### Mock provider always returns same output

- This is expected for testing. Use Ollama for varied AI-generated responses.

## Safety Features

The system includes:

- ✅ Blocks antibiotics, opioids, benzodiazepines, steroids
- ✅ Filters medicines conflicting with allergies
- ✅ Adjusts recommendations for pregnancy
- ✅ Blocks dosages for children <5 years
- ✅ Triggers emergency alert for severe symptoms
- ✅ Always includes medical disclaimer

## Frontend Integration

The frontend calls this API at `http://127.0.0.1:8000/api/symptoms/recommend` and:

- Displays recommendations with medicine details
- Plays voice synthesis of TTS payload
- Shows warnings and home care advice
- Handles multi-language output

Start frontend with:

```bash
cd frontend
npm run dev
```

## License

MIT
