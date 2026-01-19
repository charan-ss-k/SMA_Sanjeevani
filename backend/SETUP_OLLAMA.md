# Complete Setup Guide - Using Mistral-7B with SMA Sanjeevani

## Goal
Get real AI-generated responses from Mistral-7B instead of hardcoded "Viral Fever"

## Step 1: Install Ollama

1. Download from [ollama.ai](https://ollama.ai)
2. Install and run the installer
3. Ollama will automatically start and run in background

## Step 2: Download Mistral Model

Open PowerShell and run:

```powershell
ollama pull mistral
```

This downloads Mistral-7B (~4GB). First time takes 5-10 minutes.

Verify it installed:
```powershell
ollama list
```

You should see `mistral` in the list.

## Step 3: Update Backend Configuration

In `backend/.env`, make sure it has:

```env
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=1024
```

**Important**: Change `LLM_PROVIDER` from `mock` to `ollama`

## Step 4: Verify Ollama is Working

Run the test script:

```powershell
cd "D:\GitHub 2\SMA_Sanjeevani\backend"
python test_ollama.py
```

You should see:
```
✓ Ollama is running at http://localhost:11434
✓ Available models: ['mistral:latest']
✓ Mistral model is available
✓ Mistral responded successfully
✓ Output is valid JSON
✓ All checks passed!
```

If you get connection errors:
- Make sure Ollama is running: Check taskbar or run `ollama serve` in new terminal

## Step 5: Start the Backend

```powershell
cd "D:\GitHub 2\SMA_Sanjeevani"
python -m uvicorn backend.main:app --reload --port 8000
```

You should see logs like:
```
INFO:     LLM provider: 'ollama'
INFO:     *** CALLING MISTRAL-7B VIA OLLAMA ***
```

## Step 6: Test the Endpoint

Check status:
```powershell
curl http://127.0.0.1:8000/api/symptoms/status
```

Should return:
```json
{
  "status": "ok",
  "llm_provider": "ollama",
  "ollama_url": "http://localhost:11434",
  "ollama_model": "mistral"
}
```

Test with different symptoms:

**Test 1: Cough**
```powershell
curl -X POST http://127.0.0.1:8000/api/symptoms/recommend -H "Content-Type: application/json" -d '{
  "age": 25,
  "gender": "male",
  "symptoms": ["cough", "sore throat", "runny nose"],
  "allergies": [],
  "existing_conditions": [],
  "pregnancy_status": false,
  "language": "english"
}'
```

Should return condition like "Common Cold" or "Upper Respiratory Infection" (from Mistral)

**Test 2: Stomach Issues**
```powershell
curl -X POST http://127.0.0.1:8000/api/symptoms/recommend -H "Content-Type: application/json" -d '{
  "age": 30,
  "gender": "female",
  "symptoms": ["diarrhea", "stomach pain", "nausea"],
  "allergies": [],
  "existing_conditions": [],
  "pregnancy_status": false,
  "language": "english"
}'
```

Should return condition like "Gastroenteritis" (from Mistral)

**Test 3: Skin Issue**
```powershell
curl -X POST http://127.0.0.1:8000/api/symptoms/recommend -H "Content-Type: application/json" -d '{
  "age": 20,
  "gender": "male",
  "symptoms": ["rash", "itching", "red patches"],
  "allergies": [],
  "existing_conditions": [],
  "pregnancy_status": false,
  "language": "english"
}'
```

Should return condition like "Eczema" or "Dermatitis" (from Mistral)

## Step 7: Check Backend Logs

Watch the backend terminal for logs showing:
- `*** CALLING MISTRAL-7B VIA OLLAMA ***` - means Ollama is being called
- `Mistral raw output` - shows what Mistral returned
- `✓ Successfully parsed JSON from Mistral` - means response was valid

## Troubleshooting

### Still getting "Viral Fever"

Check:
1. `.env` file has `LLM_PROVIDER=ollama` (not `mock`)
2. Restart backend after changing .env
3. Run `test_ollama.py` to verify Ollama connection
4. Check backend logs for `LLM provider:` - should show `ollama`

### "Cannot connect to Ollama"

Solutions:
1. Ollama not running: Start it with `ollama serve`
2. Wrong URL in .env: Default is `http://localhost:11434`
3. Ollama crashed: Restart with `ollama serve`

### "Mistral model not found"

Run:
```powershell
ollama pull mistral
```

### Mistral taking too long

Mistral-7B needs good CPU/GPU:
- First response: 30-120 seconds
- Subsequent responses: Faster (usually 10-30 seconds)
- Monitor CPU usage while Mistral processes

## Architecture

```
Frontend
   ↓ (POST /api/symptoms/recommend with user input)
Backend (FastAPI)
   ↓ (sends prompt to Ollama)
Ollama Service
   ↓ (calls Mistral-7B model)
Mistral-7B LLM
   ↓ (generates JSON response)
Backend (parses JSON)
   ↓ (returns to frontend)
Frontend (displays recommendations)
```

## Expected Behavior

- **Input**: Fever, headache, body pain
- **Output from Mistral**: "Viral Fever" with Paracetamol recommendation
- **Input**: Cough, sore throat
- **Output from Mistral**: "Common Cold" with cough syrup recommendation
- **Input**: Diarrhea, stomach pain
- **Output from Mistral**: "Gastroenteritis" with ORS recommendation

Each response is AI-generated and different based on symptoms!
