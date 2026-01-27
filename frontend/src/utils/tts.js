/**
 * Coqui TTS Utility with Queue Management for React components
 * Handles text-to-speech with sequential playback (no overlapping voices)
 */

// Global TTS Queue and State Management
const ttsQueue = [];
let ttsPlaying = false;
let currentAudio = null;
let currentUtterance = null;

/**
 * Add TTS request to queue for sequential playback
 * @param {string} text - Text to speak
 * @param {string} language - Language code (default: 'english')
 * @returns {Promise} - Resolves when audio finishes playing
 */
export function playTTS(text, language = 'english') {
  if (!text || text.trim().length === 0) {
    console.warn('⚠️ Empty text provided to TTS');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Add to queue with resolve/reject callbacks
    ttsQueue.push({
      text,
      language,
      resolve,
      reject,
      timestamp: Date.now()
    });

    console.log(`📝 TTS queued: "${text.substring(0, 50)}..." (Queue length: ${ttsQueue.length})`);

    // Process queue if not already playing
    _processTTSQueue();
  });
}

/**
 * Stop all TTS playback and clear queue
 */
export function stopAllTTS() {
  console.log('🛑 Stopping all TTS');
  
  // Stop Coqui TTS
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  // Stop Web Speech API
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (currentUtterance) {
    currentUtterance = null;
  }

  // Clear queue and reject all pending promises
  ttsQueue.forEach(item => item.reject(new Error('TTS stopped')));
  ttsQueue.length = 0;
  ttsPlaying = false;
}

/**
 * Mute TTS without clearing queue
 */
export function muteTTS() {
  console.log('🔇 Muting TTS');
  if (currentAudio) {
    currentAudio.volume = 0;
  }
  if (window.speechSynthesis && currentUtterance) {
    currentUtterance.volume = 0;
  }
}

/**
 * Unmute TTS
 */
export function unmuteTTS() {
  console.log('🔊 Unmuting TTS');
  if (currentAudio) {
    currentAudio.volume = 1;
  }
  if (window.speechSynthesis && currentUtterance) {
    currentUtterance.volume = 1;
  }
}

/**
 * Internal: Process TTS queue sequentially
 */
async function _processTTSQueue() {
  // If already playing, wait for current to finish
  if (ttsPlaying) {
    console.log('⏳ TTS busy, waiting...');
    return;
  }

  // Check if queue is empty
  if (ttsQueue.length === 0) {
    ttsPlaying = false;
    return;
  }

  // Get next item from queue
  const item = ttsQueue.shift();
  ttsPlaying = true;

  console.log(`🔊 Processing TTS: "${item.text.substring(0, 50)}..." (${ttsQueue.length} remaining)`);

  try {
    // Play the TTS
    await _playTTSInternal(item.text, item.language);
    
    // Resolve the promise
    item.resolve();
    
    console.log(`✅ TTS completed: "${item.text.substring(0, 50)}..."`);
  } catch (error) {
    console.error('❌ TTS Error:', error);
    item.reject(error);
  }

  // Process next item in queue
  ttsPlaying = false;
  
  if (ttsQueue.length > 0) {
    // Small delay to ensure clean separation between audio playback
    await new Promise(resolve => setTimeout(resolve, 300));
    _processTTSQueue();
  }
}

/**
 * Internal: Play TTS using Coqui API or fallback to Web Speech
 * @returns {Promise} - Resolves when audio finishes
 */
async function _playTTSInternal(text, language) {
  try {
    // Try Coqui TTS first
    console.log(`🎤 Attempting Coqui TTS for ${language}`);
    await _playCoquiTTS(text, language);
  } catch (error) {
    console.warn(`⚠️ Coqui TTS failed: ${error.message}, falling back to Web Speech API`);
    // Fallback to Web Speech API
    await _playWebSpeechTTS(text, language);
  }
}

/**
 * Internal: Play TTS using Coqui API
 * @returns {Promise} - Resolves when audio finishes playing
 */
async function _playCoquiTTS(text, language) {
  return new Promise((resolve, reject) => {
    try {
      const apiBase = window.__API_BASE__ || 'http://localhost:8000';

      // Fetch audio from Coqui TTS API
      fetch(`${apiBase}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: language,
        }),
        timeout: 30000,
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (!data.audio) {
            throw new Error('No audio in response');
          }

          // Decode base64 audio
          const binaryString = atob(data.audio);
          const bytes = new Uint8Array(binaryString.length);

          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const blob = new Blob([bytes], { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(blob);

          // Create and play audio element
          currentAudio = new Audio(audioUrl);
          currentAudio.volume = 1;

          // Resolve when audio ends
          currentAudio.onended = () => {
            currentAudio = null;
            resolve();
          };

          currentAudio.onerror = () => {
            currentAudio = null;
            reject(new Error('Audio playback failed'));
          };

          // Start playing
          currentAudio.play().catch(err => {
            currentAudio = null;
            reject(new Error(`Playback error: ${err.message}`));
          });
        })
        .catch(error => {
          currentAudio = null;
          reject(new Error(`Coqui TTS failed: ${error.message}`));
        });
    } catch (error) {
      reject(error);
    }

    // Timeout protection - reject if audio takes too long
    const timeout = setTimeout(() => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
      reject(new Error('TTS timeout'));
    }, 30000);

    // Clear timeout when done
    const originalResolve = resolve;
    const originalReject = reject;
    resolve = (value) => {
      clearTimeout(timeout);
      originalResolve(value);
    };
    reject = (error) => {
      clearTimeout(timeout);
      originalReject(error);
    };
  });
}

/**
 * Internal: Fallback to Web Speech API for TTS
 * @returns {Promise} - Resolves when speech ends
 */
async function _playWebSpeechTTS(text, language) {
  return new Promise((resolve, reject) => {
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

      // Clear any previous utterance
      window.speechSynthesis.cancel();

      // Store current utterance
      currentUtterance = utterance;

      // Resolve when speech ends
      utterance.onend = () => {
        currentUtterance = null;
        resolve();
      };

      // Handle errors
      utterance.onerror = (event) => {
        currentUtterance = null;
        reject(new Error(`Web Speech error: ${event.error}`));
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
      console.log(`✓ Using Web Speech API for ${language}`);
    } catch (error) {
      reject(error);
    }

    // Timeout protection for Web Speech
    const timeout = setTimeout(() => {
      if (currentUtterance) {
        window.speechSynthesis.cancel();
        currentUtterance = null;
      }
      reject(new Error('Web Speech timeout'));
    }, 30000);

    // Clear timeout when done
    const originalResolve = resolve;
    const originalReject = reject;
    resolve = (value) => {
      clearTimeout(timeout);
      originalResolve(value);
    };
    reject = (error) => {
      clearTimeout(timeout);
      originalReject(error);
    };
  });
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
