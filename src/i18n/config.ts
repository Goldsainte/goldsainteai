import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import ko from './locales/ko.json';
import ar from './locales/ar.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  pt: { translation: pt },
  ja: { translation: ja },
  zh: { translation: zh },
  ko: { translation: ko },
  ar: { translation: ar },
};

// Get saved language or detect browser language
const getSavedLanguage = () => {
  try {
    const saved = localStorage.getItem('appLanguage');
    if (saved) return saved;
    
    // Detect browser language
    const browserLang = navigator.language.split('-')[0]; // Get 'en' from 'en-US'
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko', 'ar'];
    
    return supportedLanguages.includes(browserLang) ? browserLang : 'en';
  } catch {
    return 'en';
  }
};

const applyDirection = (lang: string) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

const initialLang = getSavedLanguage();
applyDirection(initialLang);

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })
  .catch((error) => {
    console.error('i18n initialization error:', error);
  });

i18n.on('languageChanged', (newLang) => {
  applyDirection(newLang);
});

export default i18n;
