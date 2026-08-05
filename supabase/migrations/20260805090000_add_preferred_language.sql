-- H11a: recipient language for backend emails & notifications.
-- The frontend (LanguageContext) keeps this in sync with the user's chosen
-- UI language; edge functions read it to localize transactional email.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';

COMMENT ON COLUMN public.profiles.preferred_language IS
  'BCP-47 primary subtag of the user''s chosen UI language (en, fr, es, de, it, pt, ar, ja, ko, zh). Drives transactional email locale. Defaults to en.';

-- Fast lookups are already by primary key; no index needed. No CHECK
-- constraint: future languages must not require a migration to adopt.
