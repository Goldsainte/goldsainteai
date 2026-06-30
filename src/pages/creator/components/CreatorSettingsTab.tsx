import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User,
  CreditCard,
  Award,
  Sparkles,
  FileText,
  BookOpen,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  SettingsSectionCard,
  NotificationPreferencesSection,
  SecuritySection,
  PrivacyDataSection,
} from "@/components/settings/SettingsSharedSections";

interface StripeStatus {
  connected: boolean;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
}

interface AIUsage {
  used: number;
  limit: number;
  tier: string;
  remaining: number;
}

interface TierInfo {
  name: string;
  commissionRate: number;
  next?: { name: string; threshold: number };
  progress: number;
  current: number;
  threshold: number;
}

const TIER_DEFINITIONS = [
  { name: "Bronze", threshold: 0, commission: 0.2 },
  { name: "Silver", threshold: 5000, commission: 0.18 },
  { name: "Gold", threshold: 25000, commission: 0.15 },
  { name: "Platinum", threshold: 100000, commission: 0.12 },
];

function deriveTier(totalEarnings: number): TierInfo {
  let idx = 0;
  for (let i = TIER_DEFINITIONS.length - 1; i >= 0; i--) {
    if (totalEarnings >= TIER_DEFINITIONS[i].threshold) {
      idx = i;
      break;
    }
  }
  const current = TIER_DEFINITIONS[idx];
  const next = TIER_DEFINITIONS[idx + 1];
  const progress = next
    ? Math.min(
        100,
        ((totalEarnings - current.threshold) /
          (next.threshold - current.threshold)) *
          100,
      )
    : 100;
  return {
    name: current.name,
    commissionRate: current.commission,
    next: next ? { name: next.name, threshold: next.threshold } : undefined,
    progress,
    current: totalEarnings,
    threshold: current.threshold,
  };
}

export function CreatorSettingsTab() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsage | null>(null);
  const [tier, setTier] = useState<TierInfo>(deriveTier(0));

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      try {
        const { data } = await supabase.functions.invoke(
          "check-creator-stripe-status",
        );
        if (data) setStripeStatus(data as StripeStatus);
      } catch (e) {
        console.warn("Stripe status fetch failed", e);
      }

      try {
        const { data } = await supabase.functions.invoke("check-ai-usage");
        if (data) setAiUsage(data as AIUsage);
      } catch (e) {
        console.warn("AI usage fetch failed", e);
      }

      try {
        const { data: earnings } = await supabase
          .from("earnings_ledger")
          .select("amount")
          .eq("user_id", user.id);
        const total = (earnings ?? []).reduce(
          (sum, r: any) => sum + Number(r.amount ?? 0),
          0,
        );
        setTier(deriveTier(total));
      } catch (e) {
        console.warn("Earnings fetch failed", e);
      }
    })();
  }, []);

  const handleManagePayments = async () => {
    setLoadingPortal(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Please sign in to manage payments");
        return;
      }
      const { data, error } = await supabase.functions.invoke(
        "customer-portal",
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Unable to open payment settings. Please try again.");
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleConnectStripe = async () => {
    setLoadingStripe(true);
    try {
      // Use the real Stripe Connect function (same one the Earnings tab uses).
      // The old "create-creator-stripe-account" never existed → "no edge function".
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Please sign in to connect payouts");
        return;
      }
      const { data, error } = await supabase.functions.invoke("stripe-connect-link", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { origin: window.location.origin },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      console.error("Stripe connect error", e);
      toast.error(e.message || "Failed to start Stripe onboarding");
    } finally {
      setLoadingStripe(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="space-y-6">
      {/* Account & Profile */}
      <SettingsSectionCard
        icon={User}
        title="Account & Profile"
        description="Manage your username, avatar, and bio"
      >
        <p className="text-sm text-[#6B7280]">
          Edit your public creator profile, display name, and personal details.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4] rounded-full"
          >
            <Link to="/travel-settings">
              <ExternalLink className="h-4 w-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
          {userId && (
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4] rounded-full"
            >
              <Link to={`/creators/${userId}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public Profile
              </Link>
            </Button>
          )}
        </div>
      </SettingsSectionCard>

      {/* Payouts & Stripe Connect */}
      <SettingsSectionCard
        icon={CreditCard}
        title="Payouts & Stripe Connect"
        description="Manage payouts and connected account"
      >
        {stripeStatus?.connected ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm">
              {stripeStatus.payouts_enabled ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-[#0c4d47]" />
                  <span className="text-[#0a2225] font-medium">
                    Payouts enabled
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-[#0a2225] font-medium">
                    Onboarding incomplete
                  </span>
                </>
              )}
            </div>
            <Button
              onClick={handleManagePayments}
              disabled={loadingPortal}
              className="w-full sm:w-auto bg-[#0c4d47] hover:bg-[#073331] text-white rounded-full"
            >
              {loadingPortal ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Open Stripe Dashboard
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#6B7280]">
              Connect your Stripe account to receive payouts from bookings and
              sales.
            </p>
            <Button
              onClick={handleConnectStripe}
              disabled={loadingStripe}
              className="w-full sm:w-auto bg-[#0c4d47] hover:bg-[#073331] text-white rounded-full"
            >
              {loadingStripe ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Connect Stripe
            </Button>
          </div>
        )}
      </SettingsSectionCard>

      {/* Creator Tier */}
      <SettingsSectionCard
        icon={Award}
        title="Creator Tier"
        description="Your tier and commission rate"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-secondary text-[#0a2225]">
              {tier.name}
            </p>
            <p className="text-sm text-[#6B7280]">
              Platform commission: {(tier.commissionRate * 100).toFixed(0)}%
            </p>
          </div>
          <Badge className="bg-[#F6F0E4] text-[#0a2225] hover:bg-[#E5DFC6]">
            {tier.name}
          </Badge>
        </div>
        {tier.next ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#6B7280]">
              <span>Progress to {tier.next.name}</span>
              <span>
                ${tier.current.toLocaleString()} / $
                {tier.next.threshold.toLocaleString()}
              </span>
            </div>
            <Progress value={tier.progress} className="h-2" />
          </div>
        ) : (
          <p className="text-sm text-[#0c4d47] font-medium">
            You've reached the top tier. Thank you for being a top creator!
          </p>
        )}
      </SettingsSectionCard>

      {/* Notifications */}
      <NotificationPreferencesSection
        userId={userId}
        emailLabel="Bookings, proposals, and earnings updates"
        smsLabel="Text alerts for urgent updates"
        marketingLabel="Tips, product updates, and creator features"
      />

      {/* Security */}
      <SecuritySection />

      {/* AI Content Tools */}
      <SettingsSectionCard
        icon={Sparkles}
        title="AI Content Tools"
        description="Usage and quota for AI-generated content"
      >
        {aiUsage ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-[#0a2225]">
                <span className="font-secondary text-2xl">
                  {aiUsage.used}
                </span>{" "}
                <span className="text-sm text-[#6B7280]">
                  of {aiUsage.limit} generations this month
                </span>
              </p>
              <Badge className="bg-[#F6F0E4] text-[#0a2225]">
                {aiUsage.tier}
              </Badge>
            </div>
            <Progress
              value={(aiUsage.used / aiUsage.limit) * 100}
              className="h-2"
            />
            {aiUsage.remaining <= 5 && (
              <p className="text-sm text-amber-600">
                You're running low. Consider upgrading for more capacity.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#6B7280]">Loading usage…</p>
        )}
      </SettingsSectionCard>

      {/* Tax Information */}
      <SettingsSectionCard
        icon={FileText}
        title="Tax Information"
        description="Tax forms, thresholds, and reporting"
      >
        <p className="text-sm text-[#6B7280]">
          Review tax requirements for creators and submit required forms.
        </p>
        <Button
          asChild
          variant="outline"
          className="w-full sm:w-auto border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4] rounded-full"
        >
          <Link to="/help/tax-information">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Tax Info
          </Link>
        </Button>
      </SettingsSectionCard>

      {/* Privacy & Data */}
      <PrivacyDataSection />

      {/* Content Guidelines */}
      <SettingsSectionCard
        icon={BookOpen}
        title="Content Guidelines"
        description="Standards for creator content on Goldsainte"
      >
        <p className="text-sm text-[#6B7280]">
          Review our community guidelines to keep your content compliant and
          discoverable.
        </p>
        <Button
          asChild
          variant="outline"
          className="w-full sm:w-auto border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4] rounded-full"
        >
          <Link to="/community-guidelines">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Guidelines
          </Link>
        </Button>
      </SettingsSectionCard>
    </div>
  );
}
