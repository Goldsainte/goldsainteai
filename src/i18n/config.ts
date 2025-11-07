import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt from './locales/pt.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  pt: { translation: pt },
};

// Get saved language or detect browser language
const getSavedLanguage = () => {
  try {
    const saved = localStorage.getItem('appLanguage');
    if (saved) return saved;
    
    // Detect browser language
    const browserLang = navigator.language.split('-')[0]; // Get 'en' from 'en-US'
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt'];
    
    return supportedLanguages.includes(browserLang) ? browserLang : 'en';
  } catch {
    return 'en';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })
  .catch((error) => {
    console.error('i18n initialization error:', error);
  });

export default i18n;
