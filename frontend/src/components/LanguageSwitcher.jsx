import React, { useState, useEffect } from 'react';

const LANGUAGES = {
  english: { name: 'English', flag: '🇬🇧', code: 'en' },
  telugu: { name: 'తెలుగు', flag: '🇮🇳', code: 'te' },
  hindi: { name: 'हिन्दी', flag: '🇮🇳', code: 'hi' },
  marathi: { name: 'मराठी', flag: '🇮🇳', code: 'mr' },
  bengali: { name: 'বাংলা', flag: '🇮🇳', code: 'bn' },
  tamil: { name: 'தமிழ்', flag: '🇮🇳', code: 'ta' },
  kannada: { name: 'ಕನ್ನಡ', flag: '🇮🇳', code: 'kn' },
  malayalam: { name: 'മലയാളം', flag: '🇮🇳', code: 'ml' },
  gujarati: { name: 'ગુજરાતી', flag: '🇮🇳', code: 'gu' },
};

export default function LanguageSwitcher({ currentLanguage, onLanguageChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageSelect = (langKey) => {
    onLanguageChange(langKey);
    localStorage.setItem('selectedLanguage', langKey);
    setIsOpen(false);
  };

  const currentLang = LANGUAGES[currentLanguage] || LANGUAGES.english;

  return (
    <div className="relative">
      {/* Language Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-shadow duration-200"
        title="Click to change language"
      >
        <span className="text-xl">{currentLang.flag}</span>
        <span className="text-sm font-semibold hidden sm:inline">{currentLang.name}</span>
        <span className="text-lg">▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
          <div className="p-3">
            <h3 className="text-sm font-bold text-gray-700 mb-3 px-2">Select Language</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(LANGUAGES).map(([key, lang]) => (
                <button
                  key={key}
                  onClick={() => handleLanguageSelect(key)}
                  className={`p-2 rounded text-left transition-all duration-200 ${
                    currentLanguage === key
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg mr-2">{lang.flag}</span>
                  <span className="text-xs sm:text-sm">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-500">
            💡 Audio will be in selected language
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}
