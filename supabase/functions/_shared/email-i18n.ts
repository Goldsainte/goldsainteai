// Shared email i18n for edge functions (H11b).
//
// Resolution order for an email's language:
//   1. explicit `lang` passed by the caller in templateData (if supported)
//   2. recipient's profiles.preferred_language, looked up by email (best-effort)
//   3. 'en'
//
// Everything here is fail-open: a missing column, table, or row must never
// block a send — the email simply falls back to English.

export const SUPPORTED_EMAIL_LANGS = [
  'en', 'fr', 'es', 'de', 'it', 'pt', 'ar', 'ja', 'ko', 'zh',
] as const

export type EmailLang = (typeof SUPPORTED_EMAIL_LANGS)[number]

export function normalizeLang(input: unknown): EmailLang {
  if (typeof input !== 'string') return 'en'
  const primary = input.toLowerCase().split('-')[0]
  return (SUPPORTED_EMAIL_LANGS as readonly string[]).includes(primary)
    ? (primary as EmailLang)
    : 'en'
}

/** Pick a language table entry with guaranteed English fallback. */
export function pickLang<T>(table: Partial<Record<EmailLang, T>> & { en: T }, lang: unknown): T {
  return table[normalizeLang(lang)] ?? table.en
}

interface MinimalSupabase {
  from(table: string): {
    select(cols: string): {
      eq(col: string, val: string): {
        maybeSingle(): Promise<{ data: { preferred_language?: string | null } | null; error: unknown }>
      }
    }
  }
}

export async function resolveRecipientLanguage(
  supabase: MinimalSupabase | null,
  explicitLang: unknown,
  recipientEmail: string | null | undefined,
): Promise<EmailLang> {
  // 1. Caller knows best (e.g. the request originated from a localized UI).
  if (typeof explicitLang === 'string' && explicitLang.trim()) {
    const normalized = normalizeLang(explicitLang)
    if (normalized !== 'en' || explicitLang.toLowerCase().startsWith('en')) {
      return normalized
    }
  }
  // 2. Profile lookup by email — best-effort only.
  if (supabase && recipientEmail) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('email', recipientEmail.toLowerCase())
        .maybeSingle()
      if (data?.preferred_language) return normalizeLang(data.preferred_language)
    } catch (_e) {
      // fail-open
    }
  }
  return 'en'
}
