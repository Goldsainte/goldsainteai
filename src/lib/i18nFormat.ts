// i18nFormat — the single source of truth for locale-aware formatting (H5).
//
// Dates rendered through date-fns are handled globally: src/i18n/config.ts
// calls setDefaultOptions({ locale }) on boot and on every language change,
// so every existing `format(...)` / `formatDistanceToNow(...)` call localizes
// with zero call-site changes.
//
// Native Intl call sites (toLocaleDateString / Intl.DateTimeFormat) cannot be
// defaulted globally, so they take gsIntlLocale() as their locale argument.
//
// STANDING DECISIONS (do not "fix" without a product call):
// - Arabic maps to 'ar-u-nu-latn': Arabic text, Latin (Western) digits, so
//   prices and dates keep the numeral style used across the brand design.
// - Currency stays USD platform-wide; pure number/currency formatting that
//   still says "en-US" is a deliberate hold, not an oversight (see audit §3.1).
import i18n from '@/i18n/config';

const INTL_LOCALE: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-BR',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ko: 'ko-KR',
  ar: 'ar-u-nu-latn',
};

/** BCP-47 tag for the currently active UI language, for Intl.* APIs. */
export const gsIntlLocale = (): string => {
  const lang = (i18n.language || 'en').split('-')[0];
  return INTL_LOCALE[lang] ?? 'en-US';
};
