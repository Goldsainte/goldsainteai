// ComposeTranslateAssist — opt-in, consent-first compose-side translation.
//
// When the person you're writing to reads a different language than the one
// your app is set to, this renders a single quiet line under the composer:
// "Translate to X". Tapping it fetches a translation (same translate-content
// edge function + cache as read-side translation), shows it as a PREVIEW, and
// only replaces your draft if you tap "Use". You still press Send yourself —
// the system never speaks for you (authorship stays consented, the recipient
// still gets read-side translation as a safety net either way).
//
// Fail-open: any error simply hides the affordance. A chat must never break
// because translation hiccuped.
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Languages, X } from "lucide-react";

const LANG_NAMES: Record<string, string> = {
  en: "English", fr: "Français", es: "Español", de: "Deutsch", it: "Italiano",
  pt: "Português", ar: "العربية", ja: "日本語", ko: "한국어", zh: "中文",
};
const SUPPORTED = new Set(Object.keys(LANG_NAMES));

// One profile-language lookup per recipient per session.
const recipientLangCache = new Map<string, string | null>();

export function ComposeTranslateAssist({
  text,
  recipientId,
  onUseTranslation,
}: {
  text: string;
  recipientId: string | null | undefined;
  /** Replaces the composer draft with the approved translation. */
  onUseTranslation: (translated: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const appLang = (i18n.language || "en").split("-")[0];
  const [recipientLang, setRecipientLang] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const previewForRef = useRef<string>("");

  // Resolve the recipient's preferred language (cached per session).
  useEffect(() => {
    let cancelled = false;
    setRecipientLang(null);
    if (!recipientId) return;
    const cached = recipientLangCache.get(recipientId);
    if (cached !== undefined) {
      setRecipientLang(cached);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("id", recipientId)
          .maybeSingle();
        const lang = data?.preferred_language?.split("-")[0] ?? null;
        const val = lang && SUPPORTED.has(lang) ? lang : null;
        recipientLangCache.set(recipientId, val);
        if (!cancelled) setRecipientLang(val);
      } catch {
        recipientLangCache.set(recipientId, null); // fail-open: hide
      }
    })();
    return () => { cancelled = true; };
  }, [recipientId]);

  // Draft changed since the preview was made → the preview is stale, drop it.
  useEffect(() => {
    if (preview !== null && text !== previewForRef.current) setPreview(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const relevant =
    !!recipientLang && recipientLang !== appLang && text.trim().length >= 2;
  if (!relevant) return null;

  const langName = LANG_NAMES[recipientLang!] ?? recipientLang!;

  const runTranslate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-content", {
        body: { text: text.trim(), targetLang: recipientLang },
      });
      if (error || !data) return; // fail-open
      const translated: string | undefined = data.translation ?? data.text;
      if (translated && !data.same && translated.trim() !== text.trim()) {
        previewForRef.current = text;
        setPreview(translated);
      }
    } catch {
      /* fail-open */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-1 pb-1.5">
      {preview === null ? (
        <button
          type="button"
          onClick={runTranslate}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-[12px] text-[#0c4d47]/70 hover:text-[#0c4d47] disabled:opacity-50 transition-colors"
        >
          <Languages className="h-3.5 w-3.5" />
          {busy
            ? t("msg.translating", "Translating…")
            : t("msg.translateTo", { defaultValue: "Translate to {{lang}}", lang: langName })}
        </button>
      ) : (
        <div className="rounded-2xl border border-[#E5DFC6] bg-[#FDFBF7] px-3.5 py-2.5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#8D6B2F]">
            {t("msg.translationPreview", { defaultValue: "Preview \u00b7 {{lang}}", lang: langName })}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-[#0a2225]">{preview}</p>
          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                onUseTranslation(preview);
                setPreview(null);
              }}
              className="text-[12.5px] font-medium text-[#0c4d47] hover:underline"
            >
              {t("msg.useTranslation", "Use this translation")}
            </button>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="inline-flex items-center gap-1 text-[12.5px] text-[#0a2225]/50 hover:text-[#0a2225]"
            >
              <X className="h-3.5 w-3.5" /> {t("msg.keepOriginal", "Keep my original")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComposeTranslateAssist;
