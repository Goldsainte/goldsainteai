// Batched lookup: which of these user ids wear the Goldsainte seal?
// Rule: verification_active (paid) AND identity_verified (Stripe Identity).
// One IN-query per unseen batch, module-level cache, silent fail-open —
// grids can seal names without touching their own data plumbing.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, boolean>();
const inFlight = new Set<string>();

export function useVerifiedSeals(ids: Array<string | null | undefined>): Map<string, boolean> {
  const wanted = useMemo(
    () => Array.from(new Set(ids.filter((i): i is string => !!i))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join("|")]
  );
  const [, bump] = useState(0);

  useEffect(() => {
    const missing = wanted.filter((id) => !cache.has(id) && !inFlight.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => inFlight.add(id));
    (async () => {
      try {
        // profiles RLS hides other users' rows, so seal lookups go through the
        // public verified_seals view: presence in the view = wears the seal.
        const { data } = await supabase
          .from("verified_seals" as any)
          .select("id")
          .in("id", missing);
        missing.forEach((id) => cache.set(id, false));
        (data ?? []).forEach((row: any) => {
          cache.set(row.id, true);
        });
      } catch {
        missing.forEach((id) => cache.set(id, false)); // fail-open: no seal, no crash
      } finally {
        missing.forEach((id) => inFlight.delete(id));
        bump((n) => n + 1);
      }
    })();
  }, [wanted]);

  return useMemo(() => {
    const m = new Map<string, boolean>();
    wanted.forEach((id) => m.set(id, cache.get(id) === true));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, cache.size]);
}

export default useVerifiedSeals;
