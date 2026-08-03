// contentLocale — the seam between UI localization and CONTENT localization.
//
// Decision of record (owner, Aug 2026): Option A now — seller content
// (listing titles, descriptions, itineraries, bios) renders in its SOURCE
// language — with B-lite scheduled: lazy machine translation via an edge
// function ("translate-content") and a content-hash cache table
// (content_translations: source_hash, lang, text). See I18N_COVERAGE_AUDIT §3.6.
//
// Every component that renders seller-authored text should route it through
// localizedContent() rather than reading the field directly. Today this is an
// identity function; when B-lite lands, this ONE module grows the cache
// lookup + fetch and every call site lights up without edits.
import i18n from '@/i18n/config';

export interface LocalizedContent {
  text: string;
  /** true once B-lite serves a machine translation (drives the
      "translated automatically · show original" affordance). */
  translated: boolean;
  sourceText: string;
}

/** Render seller-authored content. Option A: pass-through, tagged. */
export const localizedContent = (
  sourceText: string | null | undefined,
): LocalizedContent => {
  const text = sourceText ?? '';
  return { text, translated: false, sourceText: text };
};

/** Convenience for the overwhelmingly common case. */
export const lc = (sourceText: string | null | undefined): string =>
  localizedContent(sourceText).text;

/** The UI language content should be translated INTO when B-lite activates. */
export const contentTargetLang = (): string =>
  (i18n.language || 'en').split('-')[0];
