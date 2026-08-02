import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import i18n from '@/i18n/config';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Bridges React context to the live i18n instance. The language itself is
// owned by i18next: src/i18n/config.ts boots from localStorage('appLanguage')
// (falling back to the browser language), and LanguageSelector persists every
// change back to the same key. This provider only mirrors that state — it
// must NEVER force a language or clear the persisted choice.
// (The former "lock to English until i18n is fully wired" block did exactly
// that on every render, which reset the user's language on each page load.
// i18n is fully wired now; the lock is retired.)
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<string>(
    (i18n.language || 'en').split('-')[0]
  );

  useEffect(() => {
    const onChanged = (lng: string) => setLanguageState(lng.split('-')[0]);
    i18n.on('languageChanged', onChanged);
    return () => {
      i18n.off('languageChanged', onChanged);
    };
  }, []);

  const setLanguage = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage);
    try {
      localStorage.setItem('appLanguage', newLanguage);
    } catch {
      /* storage unavailable is fine */
    }
    document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLanguage;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
