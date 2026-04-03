import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t as translate, getTranslations } from '../utils/translations';

const STORAGE_KEY = 'selectedLanguage';

export const LANGUAGES = {
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

const LanguageContext = createContext({
  language: 'english',
  setLanguage: () => {},
  languages: LANGUAGES,
  isLanguageReady: false,
  t: (key) => key,
  translations: () => ({}),
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('english');
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedLanguage && LANGUAGES[storedLanguage]) {
          setLanguageState(storedLanguage);
        }
      } finally {
        setIsLanguageReady(true);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (newLanguage) => {
    if (!LANGUAGES[newLanguage]) {
      return;
    }

    setLanguageState(newLanguage);
    await AsyncStorage.setItem(STORAGE_KEY, newLanguage);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      languages: LANGUAGES,
      isLanguageReady,
      t: (key) => translate(key, language),
      translations: () => getTranslations(language),
    }),
    [language, setLanguage, isLanguageReady]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;