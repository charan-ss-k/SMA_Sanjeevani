/**
 * Bashini-only TTS utility.
 * Audio is played only for explicit user-initiated actions.
 */

import { API_BASE } from '../config/apiBase';

let currentAudio = null;
let currentAbortController = null;

/**
 * Generate and play TTS audio using backend Bashini service.
 * Returns `true` when playback starts/completes, `false` when skipped.
 * @param {string} text - Text to speak
 * @param {string} language - Language code (default: 'english')
 * @param {object} options - Playback options
 * @param {boolean} options.userInitiated - Must be true to allow playback
 * @returns {Promise<boolean>} - Playback status
 */
export async function playTTS(text, language = 'english', options = {}) {
  if (!text || text.trim().length === 0) {
    return false;
  }

  if (!options.userInitiated && !options.allowAuto) {
    return false;
  }

  stopAllTTS();

  const speakWithBrowser = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
      return false;
    }

    const utterance = new SpeechSynthesisUtterance(text);
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
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  };

  try {
    currentAbortController = new AbortController();

    const response = await fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language,
        provider: 'bhashini',
      }),
      signal: currentAbortController.signal,
    });

    if (!response.ok) {
      throw new Error(`TTS request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data?.audio) {
      throw new Error('Bhashini TTS returned no audio');
    }

    const binaryString = atob(data.audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: data.format === 'mp3' ? 'audio/mpeg' : 'audio/wav' });
    const audioUrl = URL.createObjectURL(blob);

    await new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      currentAudio = audio;

      audio.onended = () => {
        currentAudio = null;
        resolve(true);
      };

      audio.onerror = () => {
        currentAudio = null;
        reject(new Error('Audio playback failed'));
      };

      audio
        .play()
        .then(() => {})
        .catch((error) => {
          currentAudio = null;
          reject(error);
        });
    });
    URL.revokeObjectURL(audioUrl);
    currentAbortController = null;
    return true;
  } catch (error) {
    currentAbortController = null;
    if (speakWithBrowser()) {
      return true;
    }
    throw error;
  }
}

/**
 * Stop all TTS playback and clear queue
 */
export function stopAllTTS() {
  if (typeof window !== 'undefined' && window.speechSynthesis && typeof window.speechSynthesis.cancel === 'function') {
    window.speechSynthesis.cancel();
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}

/**
 * Mute TTS without clearing queue
 */
export function muteTTS() {
  if (currentAudio) {
    currentAudio.muted = true;
  }
}

/**
 * Unmute TTS
 */
export function unmuteTTS() {
  if (currentAudio) {
    currentAudio.muted = false;
  }
}

/**
 * Get supported languages for TTS
 */
export async function getAvailableLanguages() {
  try {
    const response = await fetch(`${API_BASE}/api/tts/languages`);
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
