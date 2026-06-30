import { useState, useEffect } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Role = "traveler" | "creator" | "agent";

interface ChecklistData {
  profile?: any;
  tripRequests?: number;
  savedTrips?: number;
  trips?: number;
  guides?: number;
  profileViews?: number;
  publishedTrips?: number;
  proposalsSent?: number;
  activity?: { has_browsed_marketplace?: boolean; has_shared_profile?: boolean };
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  cta: {
    label: string;
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
  {
    id: "save-trip",
    label: "Save a trip you love",
    description: "Build a wishlist of trips for later.",
    cta: { label: "Browse trips", to: "/marketplace" },
    isComplete: (d) => (d.savedTrips || 0) > 0,
  },
  {
    id: "read-trust-safety",
    label: "Read how we protect your trip",
    description: "Learn how escrow, verification, and dispute resolution keep your money safe.",
    cta: { label: "Trust & Safety", to: "/trust-safety" },
    isComplete: () => false,
  },
  {
    id: "set-notifications",
    label: "Set your notification preferences",
    description: "Choose email or SMS so you never miss a proposal from a specialist.",
    cta: { label: "Notification settings", to: "/travel-settings" },
    isComplete: (d) => !!d.profile?.notification_preferences,
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
    id: "connect-stripe",
    label: "Connect your payout account",
    description: "Set up Stripe Connect to receive commissions on bookings and guide sales.",
    cta: { label: "Connect Stripe", to: "/creator-dashboard?tab=earnings", event: "start-stripe-onboarding" },
    isComplete: (d) =>
      !!(d.profile?.stripe_connect_account_id || d.profile?.stripe_account_id),
  },
  {
    id: "create-content",
    label: "Publish your first product",
    description: "Create a trip package or sell a digital itinerary guide.",
    cta: { label: "Get started", to: "/trip-builder" },
    isComplete: (d) => (d.trips || 0) > 0 || (d.guides || 0) > 0,
  },
  {
    id: "share-profile",
    label: "Share your creator profile",
    description: "Your public profile is your storefront. Share it on TikTok and Instagram.",
    cta: { label: "View my profile", to: (d) => `/creators/${d.profile?.id || ""}` },
    // "creator_avg_views > 10" was an imported TikTok metric unrelated to sharing.
    // Complete when the creator opens their public profile (the share/preview action).
    isComplete: (d) => !!d.activity?.has_shared_profile,
  },
  {
    id: "review-tax-info",
    label: "Review tax information",
    description: "Goldsainte issues annual tax documents based on your country of residence.",
    cta: { label: "Learn more", to: "/help/tax-information" },
    isComplete: () => false,
  },
  {
    id: "set-notifications",
    label: "Set your notification preferences",
    description: "Stay on top of new bookings, messages, and tier upgrades.",
    cta: { label: "Notification settings", to: "/creator-dashboard?tab=settings" },
    isComplete: (d) => !!d.profile?.notification_preferences,
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
    id: "connect-stripe",
    label: "Connect your payout account",
    description: "Set up Stripe Connect so you can receive payments from travelers.",
    cta: { label: "Connect Stripe", to: "/agent-dashboard?tab=earnings", event: "start-stripe-onboarding" },
    isComplete: (d) =>
      !!(d.profile?.stripe_connect_account_id || d.profile?.stripe_account_id),
  },
  {
    id: "publish-trip",
    label: "Publish your first trip",
    description: "Build a trip listing with itinerary, pricing, and cancellation terms.",
    cta: { label: "Create trip", to: "/trip-builder" },
    isComplete: (d) => (d.publishedTrips || 0) > 0,
  },
  {
    id: "respond-request",
    label: "Send your first proposal",
    description: "Browse open trip requests and submit a custom proposal.",
    cta: { label: "View requests", to: "/marketplace?tab=trip-requests" },
    isComplete: (d) => (d.proposalsSent || 0) > 0,
  },
  {
    id: "review-tax-info",
    label: "Review tax and credentials information",
    description: "Tax documents and credential requirements vary by country. Review what applies to you.",
    cta: { label: "Learn more", to: "/help/agent-requirements" },
    isComplete: () => false,
  },
  {
    id: "set-notifications",
    label: "Set your notification preferences",
    description: "Get instant alerts for new requests and traveler messages.",
    cta: { label: "Notification settings", to: "/agent-dashboard?tab=settings" },
    isComplete: (d) => !!d.profile?.notification_preferences,
  },
];

export function GettingStartedChecklist({ userId, role }: Props) {
  const [data, setData] = useState<ChecklistData | null>(null);
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
          const [{ count: tCount }, { count: gCount }] = await Promise.all([
            client.from("packaged_trips").select("id", { count: "exact", head: true }).eq("creator_id", userId).in("status", ["pending_review", "published"]),
            client.from("itinerary_products").select("id", { count: "exact", head: true }).eq("creator_id", userId).in("status", ["pending_review", "published"]),
          ]);
          stats.trips = tCount || 0;
          stats.guides = gCount || 0;
          stats.profileViews = profile?.creator_avg_views || 0;
        } else if (role === "agent") {
          const [{ count: ptCount }, { count: pCount }] = await Promise.all([
            client.from("packaged_trips").select("id", { count: "exact", head: true }).eq("agent_id", userId).eq("status", "published"),
            client.from("trip_proposals").select("id", { count: "exact", head: true }).eq("agent_id", userId),
          ]);
          stats.publishedTrips = ptCount || 0;
          stats.proposalsSent = pCount || 0;
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
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent(item.cta.event!));
                    }}
                    className="flex-shrink-0 inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-[#0c4d47] hover:underline whitespace-nowrap"
                  >
                    {item.cta.label}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Link
                    to={to}
                    onClick={() => {
                      // "Share your creator profile" completes when they open it.
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
                    {item.cta.label}
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