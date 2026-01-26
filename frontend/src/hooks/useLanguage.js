/**
 * Custom hook for language translations
 * Makes it easy to use translations in any component
 */
import { useContext } from 'react';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';

export function useLanguage() {
  const { language } = useContext(LanguageContext);
  
  return {
    language,
    t: (key) => t(key, language),
    // Helper to get all translations for current language
    translations: () => {
      const { getTranslations } = require('../utils/translations');
      return getTranslations(language);
    }
  };
}
