import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * One-click Goldsainte AI rewrite for any free-text application field.
 * Sends the draft to ai-proposal-polish (mode: field_polish); on success,
 * replaces the field via onRewrite. Never fires with fewer than 10 chars.
 */
export function AIRewriteButton({
  value,
  onRewrite,
  fieldLabel,
  persona,
  className,
}: {
  value: string;
  onRewrite: (text: string) => void;
  fieldLabel: string;
  persona: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const tooShort = (value?.trim().length ?? 0) < 10;

  async function run() {
    if (busy || tooShort) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-proposal-polish", {
        body: { mode: "field_polish", text: value, field_label: fieldLabel, persona },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      if ((data as any)?.text) {
        onRewrite((data as any).text);
        toast.success("Rewritten — make it yours before submitting.");
      }
    } catch (e: any) {
      console.error("AI rewrite failed:", e);
      toast.error(e.message || "Couldn't rewrite right now — your text is untouched.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy || tooShort}
      title={tooShort ? "Write a rough draft first (10+ characters)" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#C7A962]/50 bg-[#C7A962]/10 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8D6B2F] transition-colors hover:bg-[#C7A962]/20 disabled:cursor-not-allowed disabled:opacity-45 ${className ?? ""}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      {busy ? "Rewriting…" : "Rewrite with AI"}
    </button>
  );
}
