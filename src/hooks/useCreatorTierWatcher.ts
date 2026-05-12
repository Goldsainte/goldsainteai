import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { TIER_COMMISSION, type CreatorTier } from "@/components/creator/TierBadge";

const TIER_RANK: Record<CreatorTier, number> = { bronze: 0, silver: 1, gold: 2, platinum: 3 };
const TIER_LABEL: Record<CreatorTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

/**
 * Watches the signed-in user's creator_tier on profiles. When it upgrades,
 * pops a celebratory toast and fires a congrats email via Resend.
 */
export function useCreatorTierWatcher() {
  const { user } = useAuth();
  const lastTierRef = useRef<CreatorTier | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("creator_tier")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled && data?.creator_tier) {
        lastTierRef.current = data.creator_tier as CreatorTier;
      }
    })();

    const channel = supabase
      .channel(`creator-tier-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const next = (payload.new as any)?.creator_tier as CreatorTier | undefined;
          if (!next || !(next in TIER_RANK)) return;
          const prev = lastTierRef.current;
          lastTierRef.current = next;
          if (!prev || TIER_RANK[next] <= TIER_RANK[prev]) return;
          if (next === "bronze") return;

          const rate = TIER_COMMISSION[next];
          toast.success(`🎉 You've reached ${TIER_LABEL[next]}!`, {
            description: `New commission rate: ${rate}%`,
            duration: 7000,
          });

          supabase.functions
            .invoke("notify-tier-upgrade", {
              body: {
                user_id: user.id,
                tier: next,
                previous_tier: prev,
                commission_rate: rate,
              },
            })
            .catch((e) => console.warn("notify-tier-upgrade failed", e));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}