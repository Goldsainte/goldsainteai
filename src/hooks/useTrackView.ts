import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fires a debounced view-count increment for a marketplace item.
 * Uses sessionStorage to ensure each session counts at most once per item per hour.
 */
export function useTrackView(kind: "trip" | "product", id?: string | null) {
  useEffect(() => {
    if (!id) return;
    const key = `view:${kind}:${id}`;
    try {
      const last = sessionStorage.getItem(key);
      if (last && Date.now() - Number(last) < 60 * 60 * 1000) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {
      // ignore storage errors
    }
    const t = window.setTimeout(() => {
      supabase.functions
        .invoke("track-view", { body: { kind, id } })
        .catch((e) => console.warn("track-view failed", e));
    }, 1500);
    return () => window.clearTimeout(t);
  }, [kind, id]);
}