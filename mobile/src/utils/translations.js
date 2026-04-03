/**
 * Mobile translation utility aligned with frontend usage pattern.
 * API-compatible with frontend: t(key, language), getTranslations(language)
 */

export const translations = {
  english: {
    sanjeevani: 'Sanjeevani',
    yourPersonalHealthAssistant: 'Your Personal Health Assistant',
    login: 'Login',
    logout: 'Logout',
    selectLanguage: 'Select Language',
    chatbotWelcome:
      'Hi there! I am Sanjeevani, your AI medical assistant powered by advanced medical AI. Ask me any medical questions in any language - about symptoms, diseases, treatments, medicines, health conditions, or any medical concern. I\'m here to help with accurate health information. What can I help you with today?',
    readAloud: 'Read Aloud',
    stop: 'Stop',
    ttsProcessing: 'Processing audio...',
    error: 'Error',
    success: 'Success',
    tapToSpeak: 'Tap to speak',
    ttsMuted: 'TTS Muted',
    failedToPlayAudio: 'Failed to play audio',
    failedToLoadChatHistory: 'Failed to load chat history',
    requestStoppedShort: 'Request stopped.',
    thereWasError: 'There was an error. Please try again.',
    audioLanguageHint: 'Audio will be in selected language',
  },
  telugu: {},
  hindi: {},
  marathi: {},
  bengali: {},
  tamil: {},
  kannada: {},
  malayalam: {},
  gujarati: {},
};

export function t(key, language = 'english') {
  return translations[language]?.[key] || translations.english[key] || key;
}

export function getTranslations(language = 'english') {
  return translations[language] || translations.english;
}
