import { createContext, useContext, useState, ReactNode } from 'react';
import i18n from '@/i18n/config';
import { useAuth } from '@/contexts/AuthContext';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Temporary: lock to English until i18n is fully wired
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('appLanguage');
      localStorage.removeItem('goldsainte-language');
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    } catch {
      // ignore storage errors
    }
    if (i18n.language !== 'en') {
      i18n.changeLanguage('en');
    }
  }
  const [language, setLanguageState] = useState<string>('en');
  const { user } = useAuth();

  // Temporary: language switching is disabled until i18n is fully wired.
  const setLanguage = async (_newLanguage: string) => {
    // no-op
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
