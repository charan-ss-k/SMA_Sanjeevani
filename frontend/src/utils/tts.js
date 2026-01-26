/**
 * Coqui TTS Utility for React components
 * Handles text-to-speech with language support
 */

export async function playTTS(text, language = 'english') {
  if (!text || text.trim().length === 0) {
    console.warn('Empty text provided to TTS');
    return;
  }

  try {
    console.log(`🔊 Generating speech for language: ${language}`);
    
    // Get API base URL
    const apiBase = window.__API_BASE__ || 'http://localhost:8000';
    
    // Call backend TTS API
    const response = await fetch(`${apiBase}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        language: language,
      }),
      timeout: 30000, // 30 second timeout
    });

    if (!response.ok) {
      console.warn(`⚠️ TTS API error: ${response.status} - falling back to Web Speech`);
      // Fallback to Web Speech API
      fallbackToWebSpeech(text, language);
      return;
    }

    const data = await response.json();
    
    if (!data.audio) {
      console.warn('⚠️ No audio data in response - falling back to Web Speech');
      fallbackToWebSpeech(text, language);
      return;
    }
    
    // Create audio element and play
    const audioData = data.audio;
    const mimeType = 'audio/wav';
    
    try {
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);
      
      const audio = new Audio(audioUrl);
      audio.play().catch(err => {
        console.warn('⚠️ Audio play error:', err);
        fallbackToWebSpeech(text, language);
      });
    } catch (decodeErr) {
      console.warn('⚠️ Audio decode error:', decodeErr);
      fallbackToWebSpeech(text, language);
    }
    
  } catch (error) {
    console.warn('⚠️ TTS Error (non-fatal):', error);
    // Fallback to Web Speech API
    fallbackToWebSpeech(text, language);
  }
}

/**
 * Fallback to Web Speech API when Coqui TTS fails
 */
function fallbackToWebSpeech(text, language) {
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map language to language codes for Web Speech API
    const langMap = {
      english: 'en-US',
      telugu: 'te-IN',
      hindi: 'hi-IN',
      marathi: 'mr-IN',
      bengali: 'bn-IN',
      tamil: 'ta-IN',
      kannada: 'kn-IN',
      malayalam: 'ml-IN',
      gujarati: 'gu-IN',
    };
    
    utterance.lang = langMap[language] || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    window.speechSynthesis.speak(utterance);
    
    console.log(`✓ Using Web Speech API for ${language}`);
  } catch (error) {
    console.error('Web Speech API Error:', error);
  }
}

/**
 * Get supported languages for TTS
 */
export async function getAvailableLanguages() {
  try {
    const apiBase = window.__API_BASE__ || 'http://localhost:8000';
    const response = await fetch(`${apiBase}/api/tts/languages`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching languages:', error);
  }
  
  // Return default languages
  return {
    english: { name: 'English', code: 'en', flag: '🇬🇧' },
    telugu: { name: 'తెలుగు (Telugu)', code: 'te', flag: '🇮🇳' },
    hindi: { name: 'हिन्दी (Hindi)', code: 'hi', flag: '🇮🇳' },
    marathi: { name: 'मराठी (Marathi)', code: 'mr', flag: '🇮🇳' },
    bengali: { name: 'বাংলা (Bengali)', code: 'bn', flag: '🇮🇳' },
    tamil: { name: 'தமிழ் (Tamil)', code: 'ta', flag: '🇮🇳' },
    kannada: { name: 'ಕನ್ನಡ (Kannada)', code: 'kn', flag: '🇮🇳' },
    malayalam: { name: 'മലയാളം (Malayalam)', code: 'ml', flag: '🇮🇳' },
    gujarati: { name: 'ગુજરાતી (Gujarati)', code: 'gu', flag: '🇮🇳' },
  };
}
