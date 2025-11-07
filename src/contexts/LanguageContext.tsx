import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from '@/i18n/config';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<string>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('appLanguage');
    if (savedLanguage) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (newLanguage: string) => {
    setLanguageState(newLanguage);
    try {
      localStorage.setItem('appLanguage', newLanguage);
      i18n.changeLanguage(newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
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
