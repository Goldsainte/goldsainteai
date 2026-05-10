import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from '@/i18n/config';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<string>(i18n.language || 'en');
  const { user } = useAuth();

  // Load language preference on mount and when user changes
  useEffect(() => {
    const loadLanguagePreference = async () => {
      if (user) {
        // Logged in: Load from database
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('preferred_language')
            .eq('id', user.id)
            .single();

          if (data && data.preferred_language) {
            setLanguageState(data.preferred_language);
            i18n.changeLanguage(data.preferred_language);
            // Sync to localStorage for faster initial load
            localStorage.setItem('appLanguage', data.preferred_language);
          }
        } catch (error) {
          console.error('Failed to load language preference:', error);
          // Fallback to localStorage
          const savedLanguage = localStorage.getItem('appLanguage');
          if (savedLanguage) {
            setLanguageState(savedLanguage);
          }
        }
      } else {
        // Not logged in: Load from localStorage
        const savedLanguage = localStorage.getItem('appLanguage');
        if (savedLanguage) {
          setLanguageState(savedLanguage);
        }
      }
    };

    loadLanguagePreference();
  }, [user]);

  // Subscribe to profile changes for real-time sync across devices
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`language-sync-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && 'preferred_language' in payload.new) {
            const newLang = payload.new.preferred_language as string;
            setLanguageState(newLang);
            i18n.changeLanguage(newLang);
            localStorage.setItem('appLanguage', newLang);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const setLanguage = async (newLanguage: string) => {
    setLanguageState(newLanguage);
    
    try {
      // Always update localStorage for fast local access
      localStorage.setItem('appLanguage', newLanguage);
      i18n.changeLanguage(newLanguage);
      if (typeof document !== 'undefined') {
        document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = newLanguage;
      }

      // If logged in, also update database
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ preferred_language: newLanguage })
          .eq('id', user.id);

        if (error) {
          console.error('Failed to save language preference to database:', error);
        }
      }
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
