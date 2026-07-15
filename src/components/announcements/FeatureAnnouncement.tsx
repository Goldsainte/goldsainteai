// FeatureAnnouncement — Instagram-style "what's new" dialog, shown once per
// user per announcement, on whatever page they land on after login.
//
// TO ANNOUNCE A FUTURE FEATURE: add one entry to ANNOUNCEMENTS below.
//   - id: unique + stable (changing it re-shows the announcement to everyone)
//   - audience: profiles.account_type values it targets; ["*"] = everyone
//   - ctaTo: the deep link straight into the feature
// Seen-state is stored per-user per-announcement in localStorage; server-side
// dismissal (cross-device dedupe) is a board item if it ever matters.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Announcement = {
  id: string;
  audience: string[];
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaTo: string;
  /** If the profile shows the user already used the feature, never show
   *  the announcement (and persist seen) — device-independent. */
  satisfiedWhen?: (profile: Record<string, any> | null) => boolean;
};

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "creator-about-questions-2026-07",
    audience: ["creator"],
    eyebrow: "New on Goldsainte",
    title: "Let travelers get to know you",
    body:
      "We added a set of optional questions to your profile — countries visited, the trip you'll never forget, the tip you swear by. Profiles with answers win more requests.",
    ctaLabel: "Answer them now",
    ctaTo: "/onboarding/creator",
    satisfiedWhen: (profile) =>
      !!profile?.about_details && Object.keys(profile.about_details).length > 0,
  },
];

const seenKey = (announcementId: string, userId: string) =>
  `gs-seen-${announcementId}-${userId}`;

export default function FeatureAnnouncement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<Announcement | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const pending = ANNOUNCEMENTS.filter(
        (a) => !localStorage.getItem(seenKey(a.id, user.id))
      );
      if (pending.length === 0) return;

      // One profile fetch covers audience targeting AND satisfied-checks.
      let profile: Record<string, any> | null = null;
      if (pending.some((a) => !a.audience.includes("*") || a.satisfiedWhen)) {
        const { data } = await supabase
          .from("profiles")
          .select("account_type, about_details")
          .eq("id", user.id)
          .maybeSingle();
        profile = (data as any) ?? null;
      }
      const accountType: string | null = profile?.account_type ?? null;

      const candidates = pending.filter((a) => {
        if (a.satisfiedWhen && a.satisfiedWhen(profile)) {
          // Already using the feature — never advertise it, on any device.
          localStorage.setItem(seenKey(a.id, user.id), "1");
          return false;
        }
        return true;
      });

      const match = candidates.find(
        (a) =>
          a.audience.includes("*") ||
          (accountType !== null && a.audience.includes(accountType))
      );
      if (!cancelled && match) setActive(match);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const dismiss = () => {
    if (active && user?.id) {
      localStorage.setItem(seenKey(active.id, user.id), "1");
    }
    setActive(null);
  };

  const goToFeature = () => {
    const to = active?.ctaTo;
    dismiss();
    if (to) navigate(to);
  };

  if (!active) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && dismiss()}>
      <DialogContent className="max-w-md rounded-[24px] border border-[#E5DFC6] bg-[#FDF9F0] p-8">
        {/* Atelier voice: ink on cream, muted-green eyebrow, serif headline,
            deep-green pill primary — gold is an accent here, not a voice. */}
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
          {active.eyebrow}
        </p>
        <h2 className="mt-2 font-secondary text-[26px] leading-tight text-[#0a2225]">
          {active.title}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[#0a2225]/70">
          {active.body}
        </p>
        <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={goToFeature}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c4d47] px-6 py-2.5 text-sm font-medium text-[#f7f3ea] hover:bg-[#0a2225] transition-colors"
          >
            {active.ctaLabel}
          </button>
          <button
            onClick={dismiss}
            className="inline-flex items-center justify-center rounded-full border border-[#0c4d47]/25 px-6 py-2.5 text-sm font-medium text-[#0a2225] hover:bg-white transition-colors"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
