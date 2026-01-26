# 🎤 Enhanced TTS Setup Guide

## Overview

The Sanjeevani application now uses an **Enhanced Multi-Tier TTS System** optimized for Indian languages:

1. **Bhashini TTS** (Primary) - Free, government-backed, excellent for Indian languages
2. **Google Cloud TTS** (Secondary) - Best quality, requires API key
3. **gTTS** (Fallback) - Simple, free, reliable
4. **Coqui TTS** (Legacy) - If others fail

## Installation

### 1. Install Required Packages

```bash
cd backend
pip install -r requirements.txt
```

This will install:
- `gtts>=2.5.0` - Google Text-to-Speech (free)
- `pydub>=0.25.1` - Audio format conversion
- `google-cloud-texttospeech>=2.16.0` - Google Cloud TTS (optional, requires API key)
- `coqui-tts` - Legacy TTS (already installed)

### 2. Configure TTS Providers (Optional)

Edit `backend/.env` to configure TTS providers:

```env
# TTS Configuration
USE_BHASHINI_TTS=true          # Use Bhashini TTS (free, recommended)
USE_GOOGLE_TTS=false           # Use Google Cloud TTS (requires API key)
USE_GTTS=true                   # Use gTTS as fallback (free)

# Google Cloud TTS (Optional - only if USE_GOOGLE_TTS=true)
GOOGLE_TTS_API_KEY=your-api-key-here

# Bhashini API Key (Optional - works without key for basic usage)
BHASHINI_API_KEY=your-api-key-here
```

## TTS Provider Details

### 1. Bhashini TTS (Recommended) ✅

**Pros:**
- ✅ **Free** - No API key required for basic usage
- ✅ **Government-backed** - Indian government initiative
- ✅ **Excellent for Indian languages** - Specifically designed for Indian languages
- ✅ **High quality** - Natural-sounding voices
- ✅ **Fast** - Low latency

**Cons:**
- ⚠️ Requires internet connection
- ⚠️ Rate limits may apply (but generous for medical applications)

**Status:** Enabled by default (`USE_BHASHINI_TTS=true`)

### 2. Google Cloud TTS (Optional) 🌟

**Pros:**
- ✅ **Best quality** - Industry-leading neural voices
- ✅ **Very natural** - Human-like speech
- ✅ **Reliable** - Enterprise-grade service
- ✅ **Multiple voices** - Different voice options per language

**Cons:**
- ❌ **Requires API key** - Need Google Cloud account
- ❌ **Paid service** - Free tier available but limited
- ❌ **Setup required** - Need to configure Google Cloud project

**Setup Steps:**
1. Create a Google Cloud project
2. Enable Text-to-Speech API
3. Create API key
4. Add to `.env`: `GOOGLE_TTS_API_KEY=your-key`
5. Set `USE_GOOGLE_TTS=true`

### 3. gTTS (Fallback) 🔄

**Pros:**
- ✅ **Free** - No API key required
- ✅ **Simple** - Easy to use
- ✅ **Reliable** - Works consistently
- ✅ **No setup** - Works out of the box

**Cons:**
- ⚠️ **Lower quality** - Not as natural as Bhashini/Google
- ⚠️ **Internet required** - Needs connection to Google servers
- ⚠️ **Rate limits** - May have limitations on heavy usage

**Status:** Enabled by default (`USE_GTTS=true`)

### 4. Coqui TTS (Legacy) 📦

**Pros:**
- ✅ **Offline** - Works without internet
- ✅ **Open source** - Free and customizable

**Cons:**
- ❌ **Heavy** - Large model files
- ❌ **Slow** - Takes time to generate
- ❌ **Setup issues** - Often has dependency conflicts

**Status:** Used only if other providers fail

## How It Works

The TTS system tries providers in this order:

1. **Bhashini TTS** (if `USE_BHASHINI_TTS=true`)
2. **Google Cloud TTS** (if `USE_GOOGLE_TTS=true` and API key provided)
3. **gTTS** (if `USE_GTTS=true`)
4. **Coqui TTS** (legacy fallback)

If one provider fails, it automatically tries the next one.

## Testing

### Test TTS Endpoint

```bash
curl -X POST http://localhost:8000/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "नमस्ते, मैं सञ्जीवनी हूँ। मैं आपकी मदद कैसे कर सकती हूँ?",
    "language": "hindi"
  }'
```

### Test Different Languages

```bash
# Telugu
curl -X POST http://localhost:8000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "నమస్కారం, నేను సంజీవని.", "language": "telugu"}'

# Tamil
curl -X POST http://localhost:8000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "வணக்கம், நான் சஞ்சீவனி.", "language": "tamil"}'
```

## Troubleshooting

### Issue: "All TTS providers failed"

**Solution:**
1. Check internet connection (Bhashini and gTTS need internet)
2. Verify packages installed: `pip install gtts pydub`
3. Check logs for specific error messages
4. Try enabling Web Speech API fallback in frontend

### Issue: "Bhashini API error"

**Solution:**
1. Check internet connection
2. Verify API endpoint is accessible
3. Try gTTS fallback (should work automatically)

### Issue: "Google TTS not working"

**Solution:**
1. Verify API key is correct in `.env`
2. Check Google Cloud project has Text-to-Speech API enabled
3. Verify billing is enabled (even for free tier)
4. Check API key has correct permissions

### Issue: "gTTS rate limit"

**Solution:**
1. Enable Bhashini TTS (primary)
2. Or use Google Cloud TTS
3. Or implement request throttling

## Recommended Configuration

For **production** (best quality):
```env
USE_BHASHINI_TTS=true
USE_GOOGLE_TTS=true
GOOGLE_TTS_API_KEY=your-key
USE_GTTS=true
```

For **development** (free, no setup):
```env
USE_BHASHINI_TTS=true
USE_GOOGLE_TTS=false
USE_GTTS=true
```

## Performance

- **Bhashini TTS**: ~1-2 seconds per request
- **Google Cloud TTS**: ~0.5-1 second per request
- **gTTS**: ~2-3 seconds per request
- **Coqui TTS**: ~5-10 seconds per request (if used)

## Supported Languages

All 9 languages are supported:
- 🇬🇧 English
- 🇮🇳 Telugu (తెలుగు)
- 🇮🇳 Hindi (हिन्दी)
- 🇮🇳 Marathi (मराठी)
- 🇮🇳 Bengali (বাংলা)
- 🇮🇳 Tamil (தமிழ்)
- 🇮🇳 Kannada (ಕನ್ನಡ)
- 🇮🇳 Malayalam (മലയാളം)
- 🇮🇳 Gujarati (ગુજરાતી)

## Next Steps

1. Install packages: `pip install -r requirements.txt`
2. Test TTS endpoint
3. Configure providers in `.env` (optional)
4. Enjoy high-quality TTS for all Indian languages! 🎉
