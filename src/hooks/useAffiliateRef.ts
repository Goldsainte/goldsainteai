import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const KEY = "gs_affiliate_ref";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Capture ?ref= from URL, persist for 30 days, fire-and-forget click tracking. */
export function useAffiliateRefCapture() {
  const [params] = useSearchParams();
  useEffect(() => {
    const ref = params.get("ref");
    if (!ref) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ ref, ts: Date.now() }));
    } catch {
      // ignore
    }
    supabase.functions.invoke("track-affiliate-click", { body: { ref } }).catch(() => {});
  }, [params]);
}

/** Read the active affiliate ref if not expired. */
export function getActiveAffiliateRef(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { ref, ts } = JSON.parse(raw);
    if (!ref || Date.now() - Number(ts) > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return ref;
  } catch {
    return null;
  }
}