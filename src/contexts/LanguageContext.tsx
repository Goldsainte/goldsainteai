import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import i18n from '@/i18n/config';
import { supabase } from '@/integrations/supabase/client';

const SUPPORTED = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ar', 'ja', 'ko', 'zh'];

// Persist the user's language to their profile so backend emails and
// notifications can be sent in the right language. Fire-and-forget: the UI
// never waits on it, and signed-out users simply skip it.
export async function syncPreferredLanguage(lng: string) {
  try {
    if (!SUPPORTED.includes(lng)) return;
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;
    await supabase
      .from('profiles')
      .update({ preferred_language: lng })
      .eq('id', data.user.id);
  } catch {
    /* non-fatal: email language falls back to English */
  }
}

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

  // Deliberate choices only: syncPreferredLanguage runs when the USER picks a
  // language (here and in LanguageSelector) — never on page load or sign-in.
  // The old on-load sync silently promoted whatever language the tab happened
  // to be in (even a temporary test flip) to the account's permanent email
  // language — that's how a.powell@cornellfacilities.com got Italian emails.
  // Its backfill purpose (profiles predating the column) is complete.

  const setLanguage = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage);
    try {
      localStorage.setItem('appLanguage', newLanguage);
    } catch {
      /* storage unavailable is fine */
    }
    document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLanguage;
    syncPreferredLanguage(newLanguage);
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
