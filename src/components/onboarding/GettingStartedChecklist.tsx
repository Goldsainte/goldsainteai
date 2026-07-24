import { useState, useEffect } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Role = "traveler" | "creator" | "agent";

interface ChecklistData {
  partnerMediaCount?: number;
  profile?: any;
  tripRequests?: number;
  savedTrips?: number;
  trips?: number;
  guides?: number;
  draftTripId?: string | null;
  profileViews?: number;
  publishedTrips?: number;
  proposalsSent?: number;
  agent?: any;
  activity?: { has_browsed_marketplace?: boolean; has_shared_profile?: boolean; has_read_handbook?: boolean };
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  cta: {
    label: string | ((d: ChecklistData) => string);
    to: string | ((d: ChecklistData) => string);
    event?: string;
  };
  isComplete: (d: ChecklistData) => boolean;
}

interface Props {
  userId: string;
  role: Role;
}

const TRAVELER_ITEMS: ChecklistItem[] = [
  {
    id: "complete-profile",
    label: "Complete your profile",
    description: "Add a photo and bio so specialists know who they're planning for.",
    cta: { label: "Edit profile", to: "/travel-profile" },
    isComplete: (d) => !!d.profile?.avatar_url && !!d.profile?.bio,
  },
  {
    id: "browse-marketplace",
    label: "Explore the marketplace",
    description: "Browse curated trips and itinerary guides from verified specialists.",
    cta: { label: "Browse trips", to: "/marketplace" },
    isComplete: (d) => !!d.activity?.has_browsed_marketplace,
  },
  {
    id: "post-request",
    label: "Post your first trip request",
    description: "Tell us your dream trip and AI matches you with the right specialists.",
    cta: { label: "Post a trip", to: "/post-trip" },
    isComplete: (d) => (d.tripRequests || 0) > 0,
  },
];

const CREATOR_ITEMS: ChecklistItem[] = [
  {
    id: "complete-onboarding",
    label: "Complete your creator profile",
    description: "Add a photo, bio, and your niches so travelers can discover you.",
    cta: { label: "Complete profile", to: "/onboarding/creator" },
    // Reflect the actual profile content the copy promises (photo + bio + niches),
    // not just the "finished the wizard" flag — so a filled profile ticks even if
    // the creator hit "Skip" on the last onboarding step.
    isComplete: (d) =>
      !!d.profile?.avatar_url &&
      !!d.profile?.bio &&
      (d.profile?.creator_niches?.length || 0) > 0,
  },
  {
    id: "add-media",
    label: "Add photos & video to your profile",
    description: "Show travelers who you are — imagery is what gets you chosen.",
    cta: { label: "Add media", to: "/profile/media" },
    isComplete: (d) => (d.partnerMediaCount || 0) > 0,
  },
  {
    id: "connect-stripe",
    label: "Connect your payout account",
    description: "Set up Stripe so you can get paid — bookings, tips, and guide sales all pay out through your own account.",
    cta: { label: "Connect Stripe", to: "/creator-dashboard?tab=earnings", event: "start-stripe-onboarding" },
    isComplete: (d) =>
      !!(d.profile?.stripe_charges_enabled || d.profile?.stripe_payouts_enabled || d.profile?.stripe_connect_payouts_enabled),
  },
  {
    id: "create-content",
    label: "Publish your first product",
    description: "Create a trip package or sell a digital itinerary guide.",
    cta: {
      // Resume the creator's existing draft if they have one, else start fresh.
      label: (d) => (d.draftTripId ? "Resume draft" : "Get started"),
      to: (d) => (d.draftTripId ? `/trip-builder?edit=${d.draftTripId}` : "/trip-builder"),
    },
    isComplete: (d) => (d.trips || 0) > 0 || (d.guides || 0) > 0,
  },
  {
    id: "share-profile",
    label: "View & share your profile",
    description: "Open your public profile, then share the link on TikTok and Instagram.",
    cta: { label: "View my profile", to: (d) => `/creators/${d.profile?.id || ""}` },
    // "creator_avg_views > 10" was an imported TikTok metric unrelated to sharing.
    // Complete when the creator opens their public profile (the share/preview action).
    isComplete: (d) => !!d.activity?.has_shared_profile,
  },
];

const AGENT_ITEMS: ChecklistItem[] = [
  {
    id: "verify-identity",
    label: "Verify your identity",
    description: "Complete Stripe Identity verification to publish trips.",
    cta: { label: "Start verification", to: "/apply/agent" },
    isComplete: (d) =>
      d.profile?.agent_verification_status === "verified" ||
      d.profile?.identity_verified === true,
  },
  {
    id: "add-media",
    label: "Add photos & video to your profile",
    description: "Show travelers who you are — imagery is what gets you chosen.",
    cta: { label: "Add media", to: "/profile/media" },
    isComplete: (d) => (d.partnerMediaCount || 0) > 0,
  },
  {
    id: "connect-stripe",
    label: "Connect your payout account",
    description: "Set up Stripe so you can get paid — deposits and balances land directly in your account.",
    cta: { label: "Connect Stripe", to: "/agent-dashboard?tab=earnings", event: "start-stripe-onboarding" },
    isComplete: (d) =>
      !!(
        d.agent?.stripe_charges_enabled ||
        d.agent?.stripe_payouts_enabled ||
        d.agent?.stripe_onboarding_completed ||
        d.profile?.stripe_charges_enabled ||
        d.profile?.stripe_payouts_enabled ||
        d.profile?.stripe_connect_payouts_enabled
      ),
  },
  {
    id: "upload-agreement",
    label: "Upload your client agreement",
    description: "Your own engagement agreement — travelers e-accept it before any deposit unlocks. Required to receive payments.",
    cta: { label: "Upload agreement", to: "/agent-settings" },
    isComplete: (d) => !!(d.agent as any)?.client_agreement_url,
  },
  {
    id: "respond-request",
    label: "Send your first proposal",
    description: "Browse open trip requests and submit a custom proposal.",
    cta: { label: "View requests", to: "/marketplace?tab=trip-requests" },
    isComplete: (d) => (d.proposalsSent || 0) > 0,
  },
];

export function GettingStartedChecklist({ userId, role }: Props) {
  const [data, setData] = useState<ChecklistData | null>(null);
  const [stripeCtaBusy, setStripeCtaBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const dismissedKey = `checklist_dismissed_${role}_${userId}`;
    if (localStorage.getItem(dismissedKey)) {
      setDismissed(true);
      return;
    }

    const load = async () => {
      try {
        const client = supabase as any;
        const { data: profile } = await client
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        const browsedKey = `visited_marketplace_${userId}`;
        const sharedKey = `gs_shared_profile_${userId}`;
        const stats: ChecklistData = {
          profile,
          activity: {
            has_browsed_marketplace:
              typeof window !== "undefined" &&
              localStorage.getItem(browsedKey) === "true",
            has_shared_profile:
              typeof window !== "undefined" &&
              localStorage.getItem(sharedKey) === "true",
            has_read_handbook: localStorage.getItem(`gs_read_handbook_${userId}`) === "true",
          },
        };

        if (role === "traveler") {
          const [{ count: trCount }, { count: wlCount }] = await Promise.all([
            client.from("trip_requests").select("id", { count: "exact", head: true }).eq("traveler_id", userId),
            client.from("trip_wishlists").select("id", { count: "exact", head: true }).eq("user_id", userId),
          ]);
          stats.tripRequests = trCount || 0;
          stats.savedTrips = wlCount || 0;
        } else if (role === "creator") {
          // "Published" here means submitted — a trip is sent to admin review as
          // 'pending_review', so count that too (not draft, which autosaves).
          const [{ count: tCount }, { count: gCount }, { data: draft }] = await Promise.all([
            client.from("packaged_trips").select("id", { count: "exact", head: true }).eq("creator_id", userId).in("status", ["pending_review", "published"]),
            client.from("itinerary_products").select("id", { count: "exact", head: true }).eq("creator_id", userId).in("status", ["pending_review", "published"]),
            // Most recent draft, so "Publish your first product" can resume it.
            client.from("packaged_trips").select("id").eq("creator_id", userId).eq("status", "draft").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
          ]);
          stats.trips = tCount || 0;
          stats.guides = gCount || 0;
          stats.draftTripId = draft?.id ?? null;
          stats.profileViews = profile?.creator_avg_views || 0;
        } else if (role === "agent") {
          const [{ count: ptCount }, { count: pCount }, { data: agentRow }] = await Promise.all([
            client.from("packaged_trips").select("id", { count: "exact", head: true }).eq("agent_id", userId).eq("status", "published"),
            client.from("trip_proposals").select("id", { count: "exact", head: true }).eq("agent_id", userId),
            // Stripe status truth lives on travel_agents (written by
            // check-stripe-connect-status) — profiles has no such flags.
            client.from("travel_agents").select("stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_completed, client_agreement_url").eq("user_id", userId).maybeSingle(),
          ]);
          stats.publishedTrips = ptCount || 0;
          stats.proposalsSent = pCount || 0;
          stats.agent = agentRow || null;
        }
        if (role === "creator" || role === "agent") {
          try {
            const { count: mCount } = await client
              .from("partner_media")
              .select("user_id", { count: "exact", head: true })
              .eq("user_id", userId);
            stats.partnerMediaCount = mCount || 0;
          } catch (_) { /* table ships with partner-media.sql */ }
        }
        setData(stats);
      } catch (err) {
        console.error("[GettingStartedChecklist] load failed", err);
      }
    };
    load();
  }, [userId, role]);

  const handleDismiss = () => {
    localStorage.setItem(`checklist_dismissed_${role}_${userId}`, "true");
    setDismissed(true);
  };

  if (dismissed || !data) return null;

  const items = role === "traveler" ? TRAVELER_ITEMS : role === "creator" ? CREATOR_ITEMS : AGENT_ITEMS;
  const completed = items.filter((item) => item.isComplete(data)).length;
  const percent = Math.round((completed / items.length) * 100);

  if (completed === items.length) return null;

  return (
    <div className="mb-6 rounded-2xl border border-[#E5DFC6] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E5DFC6]">
        <div>
          <h3 className="font-secondary text-lg sm:text-xl text-[#0a2225]">Getting Started</h3>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">{completed} of {items.length} steps complete</p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-[#9A9079] hover:text-[#0a2225] transition-colors"
          aria-label="Dismiss checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-5 sm:px-6 py-3 bg-[#FDF9F0]">
        <div className="h-1.5 w-full bg-[#E5DFC6] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0c4d47] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ul className="divide-y divide-[#F1ECDD]">
        {items.map((item) => {
          const done = item.isComplete(data);
          const to = typeof item.cta.to === "function" ? item.cta.to(data) : item.cta.to;
          const ctaLabel = typeof item.cta.label === "function" ? item.cta.label(data) : item.cta.label;
          return (
            <li key={item.id} className="flex items-start gap-4 px-5 sm:px-6 py-4">
              <div className={`flex-shrink-0 mt-0.5 h-6 w-6 rounded-full border flex items-center justify-center ${done ? "bg-[#0c4d47] border-[#0c4d47]" : "border-[#E5DFC6] bg-white"}`}>
                {done && <Check className="h-3.5 w-3.5 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${done ? "text-[#9A9079] line-through" : "text-[#0a2225]"}`}>
                  {item.label}
                </p>
                {!done && (
                  <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">{item.description}</p>
                )}
              </div>
              {!done && (
                item.cta.event ? (
                  <button
                    type="button"
                    disabled={stripeCtaBusy}
                    onClick={async () => {
                      // The event listener lives inside the earnings tab, which
                      // may not be mounted — so don't rely on it. If a mounted
                      // card wants to react (scroll into view), fine; either
                      // way we take the user straight to Stripe ourselves.
                      window.dispatchEvent(new CustomEvent(item.cta.event!));
                      setStripeCtaBusy(true);
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) return;
                        const { data, error } = await supabase.functions.invoke("stripe-connect-link", {
                          headers: { Authorization: `Bearer ${session.access_token}` },
                          body: { origin: window.location.origin },
                        });
                        if (!error && data?.url) {
                          window.location.href = data.url;
                          return;
                        }
                        console.error("[CHECKLIST] stripe-connect-link failed:", error);
                      } catch (e) {
                        console.error("[CHECKLIST] stripe-connect-link failed:", e);
                      } finally {
                        setStripeCtaBusy(false);
                      }
                    }}
                    className="flex-shrink-0 inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-[#0c4d47] hover:underline whitespace-nowrap disabled:opacity-60"
                  >
                    {stripeCtaBusy ? "Opening Stripe…" : ctaLabel}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Link
                    to={to}
                    onClick={() => {
                      // "Share your creator profile" completes when they open it.
                      if (item.id === "read-handbook") {
                        localStorage.setItem(`gs_read_handbook_${userId}`, "true");
                        setData((prev) =>
                          prev ? { ...prev, activity: { ...prev.activity, has_read_handbook: true } } : prev
                        );
                      }
                      if (item.id === "share-profile") {
                        localStorage.setItem(`gs_shared_profile_${userId}`, "true");
                        setData((prev) =>
                          prev
                            ? { ...prev, activity: { ...prev.activity, has_shared_profile: true } }
                            : prev,
                        );
                      }
                    }}
                    className="flex-shrink-0 inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-[#0c4d47] hover:underline whitespace-nowrap"
                  >
                    {ctaLabel}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
