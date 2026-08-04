// useTranslatedContent — client side of the messaging-translation layer.
//
// Given a piece of user-generated text (a message today, listing copy later),
// returns what to display in the viewer's app language, plus a toggle back to
// the original. Backed by the translate-content edge function, whose
// content-addressed cache means any text costs at most one model call per
// language, ever. This hook adds a session-level in-memory cache and in-flight
// deduplication on top, so re-renders and repeated mounts cost nothing.
//
// Failure philosophy: a chat must never break because translation hiccuped.
// Any error silently falls back to the original text.

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

type CacheEntry = {
  translation: string;
  sourceLang: string;
  same: boolean;
};

// Session caches shared across all hook instances.
const sessionCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<CacheEntry | null>>();

const MAX_CHARS = 4000;

/** Normalize i18next's language ("fr-FR") to our two-letter codes. */
function appLang(raw: string): string {
  return (raw || "en").toLowerCase().slice(0, 2);
}

/**
 * Cheap client-side skip for the dominant case: an English-language viewer
 * reading Latin-script text. Anything with characters beyond Latin-1 (Arabic,
 * CJK, Cyrillic…) still goes through the cached function; so does every
 * non-English target, since French/Spanish/etc. share the Latin script and
 * can't be told apart locally.
 */
function obviouslyEnglishFor(target: string, text: string): boolean {
  return target === "en" && !/[^\u0000-\u00ff]/.test(text);
}

async function fetchTranslation(text: string, targetLang: string): Promise<CacheEntry | null> {
  const key = `${targetLang}::${text}`;
  const cached = sessionCache.get(key);
  if (cached) return cached;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const p = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("translate-content", {
        body: { text, targetLang },
      });
      if (error || !data || typeof data.translation !== "string") return null;
      const entry: CacheEntry = {
        translation: data.translation,
        sourceLang: data.sourceLang ?? "unknown",
        same: Boolean(data.same),
      };
      sessionCache.set(key, entry);
      return entry;
    } catch {
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, p);
  return p;
}

export function useTranslatedContent(
  text: string | null | undefined,
  opts?: { enabled?: boolean },
) {
  const { i18n } = useTranslation();
  const target = appLang(i18n.language);
  const enabled = opts?.enabled !== false;

  const source = (text ?? "").trim();
  const skip =
    !enabled ||
    !source ||
    source.length > MAX_CHARS ||
    obviouslyEnglishFor(target, source);

  const key = `${target}::${source}`;
  const [entry, setEntry] = useState<CacheEntry | null>(() =>
    skip ? null : sessionCache.get(key) ?? null,
  );
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    setShowOriginal(false);
    if (skip) {
      setEntry(null);
      return;
    }
    const hit = sessionCache.get(key);
    if (hit) {
      setEntry(hit);
      return;
    }
    let cancelled = false;
    fetchTranslation(source, target).then((res) => {
      if (!cancelled) setEntry(res);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, skip]);

  return useMemo(() => {
    const isTranslated = Boolean(entry && !entry.same && entry.translation && entry.translation !== source);
    return {
      /** What to render: the translation, unless skipped/same/toggled back. */
      text: isTranslated && !showOriginal ? entry!.translation : source,
      /** True when a real translation is being shown or is available. */
      isTranslated,
      /** ISO 639-1 of the original, when known ("unknown" otherwise). */
      sourceLang: entry?.sourceLang ?? null,
      /** Whether the user has toggled back to the original text. */
      showOriginal,
      toggle: () => setShowOriginal((v) => !v),
    };
  }, [entry, showOriginal, source]);
}
