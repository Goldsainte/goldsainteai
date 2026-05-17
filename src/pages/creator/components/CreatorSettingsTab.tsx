import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User,
  CreditCard,
  Award,
  Bell,
  Shield,
  Sparkles,
  FileText,
  Database,
  BookOpen,
  Loader2,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  progress: number; // 0-100
  current: number;
  threshold: number;
}

const TIER_DEFINITIONS = [
  { name: "Bronze", threshold: 0, commission: 0.20 },
  { name: "Silver", threshold: 5000, commission: 0.18 },
  { name: "Gold", threshold: 25000, commission: 0.15 },
  { name: "Platinum", threshold: 100000, commission: 0.12 },
];

function deriveTier(totalEarnings: number): TierInfo {
  let currentIdx = 0;
  for (let i = TIER_DEFINITIONS.length - 1; i >= 0; i--) {
    if (totalEarnings >= TIER_DEFINITIONS[i].threshold) {
      currentIdx = i;
      break;
    }
  }
  const current = TIER_DEFINITIONS[currentIdx];
  const next = TIER_DEFINITIONS[currentIdx + 1];
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsage | null>(null);
  const [tier, setTier] = useState<TierInfo>(deriveTier(0));
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: false,
    marketing_emails: false,
  });

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setUserEmail(user.email ?? null);

      // Notification prefs
      const { data: profile } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.notification_preferences) {
        const prefs = profile.notification_preferences as Record<string, boolean>;
        setNotifications({
          email_notifications: prefs.email ?? true,
          sms_notifications: prefs.sms ?? false,
          marketing_emails: prefs.marketing ?? false,
        });
      }

      // Stripe status
      try {
        const { data } = await supabase.functions.invoke(
          "check-creator-stripe-status",
        );
        if (data) setStripeStatus(data as StripeStatus);
      } catch (e) {
        console.warn("Stripe status fetch failed", e);
      }

      // AI usage
      try {
        const { data } = await supabase.functions.invoke("check-ai-usage");
        if (data) setAiUsage(data as AIUsage);
      } catch (e) {
        console.warn("AI usage fetch failed", e);
      }

      // Tier from earnings
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
    };
    load();
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
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
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
      const { data, error } = await supabase.functions.invoke(
        "create-creator-stripe-account",
      );
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      console.error("Stripe connect error", e);
      toast.error(e.message || "Failed to start Stripe onboarding");
    } finally {
      setLoadingStripe(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!userId) return;
    setSavingNotifications(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          notification_preferences: {
            email: notifications.email_notifications,
            sms: notifications.sms_notifications,
            push: true,
            marketing: notifications.marketing_emails,
          },
        })
        .eq("id", userId);
      if (error) throw error;
      toast.success("Notification preferences saved");
    } catch (error: any) {
      console.error("Save notifications error:", error);
      toast.error(error.message || "Failed to save preferences");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!userEmail) {
        toast.error("Email not found. Unable to send password reset email.");
        return;
      }
      toast.loading("Sending password reset email...");
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.dismiss();
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      toast.dismiss();
      console.error("Error sending password reset:", error);
      toast.error(error?.message || "Failed to send reset email.");
    }
  };

  const handleDownloadData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Please sign in to download your data");
        return;
      }
      toast.loading("Preparing your data export...");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-user-data`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `goldsainte-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success("Your data has been downloaded");
    } catch (error: any) {
      toast.dismiss();
      console.error("Error downloading data:", error);
      toast.error(error.message || "Failed to download data");
    }
  };

  const SectionCard = ({
    icon: Icon,
    title,
    description,
    children,
  }: {
    icon: any;
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <Card className="bg-white border-[#E5DFC6] rounded-2xl">
      <CardHeader className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 p-2 bg-[#F6F0E4] rounded-xl">
            <Icon className="h-5 w-5 text-[#C7A962]" />
          </div>
          <div className="min-w-0">
            <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">
              {title}
            </CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 sm:p-6 pt-0 sm:pt-0">
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Account & Profile */}
      <SectionCard
        icon={User}
        title="Account & Profile"
        description="Manage your username, avatar, and bio"
      >
        <p className="text-sm text-[#6B7280]">
          Edit your public creator profile, display name, and personal details.
        </p>
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
      </SectionCard>

      {/* Payouts & Stripe Connect */}
      <SectionCard
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
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleManagePayments}
                disabled={loadingPortal}
                className="bg-[#0c4d47] hover:bg-[#073331] text-white rounded-full"
              >
                {loadingPortal ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Open Stripe Dashboard
              </Button>
            </div>
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
      </SectionCard>

      {/* Creator Tier */}
      <SectionCard
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
      </SectionCard>

      {/* Notification Preferences */}
      <SectionCard
        icon={Bell}
        title="Notifications"
        description="Control how we reach you"
      >
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={notifications.email_notifications}
            onCheckedChange={(checked) =>
              setNotifications((p) => ({
                ...p,
                email_notifications: !!checked,
              }))
            }
            className="mt-1"
          />
          <div className="space-y-0.5">
            <p className="text-[#0a2225] font-medium">Email Notifications</p>
            <p className="text-sm text-[#6B7280]">
              Bookings, proposals, and earnings updates
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={notifications.sms_notifications}
            onCheckedChange={(checked) =>
              setNotifications((p) => ({
                ...p,
                sms_notifications: !!checked,
              }))
            }
            className="mt-1"
          />
          <div className="space-y-0.5">
            <p className="text-[#0a2225] font-medium">SMS Notifications</p>
            <p className="text-sm text-[#6B7280]">
              Text alerts for urgent updates
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={notifications.marketing_emails}
            onCheckedChange={(checked) =>
              setNotifications((p) => ({
                ...p,
                marketing_emails: !!checked,
              }))
            }
            className="mt-1"
          />
          <div className="space-y-0.5">
            <p className="text-[#0a2225] font-medium">
              Marketing Communications
            </p>
            <p className="text-sm text-[#6B7280]">
              Tips, product updates, and creator features
            </p>
          </div>
        </label>

        <Button
          onClick={handleSaveNotifications}
          disabled={savingNotifications}
          className="w-full sm:w-auto bg-[#0c4d47] hover:bg-[#073331] text-white rounded-full"
        >
          {savingNotifications ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </SectionCard>

      {/* Security */}
      <SectionCard
        icon={Shield}
        title="Security"
        description="Manage your account security"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[#0a2225] font-medium">Change Password</p>
            <p className="text-sm text-[#6B7280]">
              We'll email you a secure reset link
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4] rounded-full shrink-0"
            onClick={handleChangePassword}
          >
            Update
          </Button>
        </div>
      </SectionCard>

      {/* AI Content Tools */}
      <SectionCard
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
      </SectionCard>

      {/* Tax Information */}
      <SectionCard
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
      </SectionCard>

      {/* Privacy & Data */}
      <SectionCard
        icon={Database}
        title="Privacy & Data"
        description="Export or delete your account data"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2 border-b border-[#E5DFC6]">
          <div className="min-w-0">
            <p className="text-[#0a2225] font-medium">Download My Data</p>
            <p className="text-sm text-[#6B7280]">
              Export a JSON copy of your account data
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4] rounded-full shrink-0"
            onClick={handleDownloadData}
          >
            Download
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
          <div className="min-w-0">
            <p className="text-[#0a2225] font-medium">Delete Account</p>
            <p className="text-sm text-[#6B7280]">
              Permanently remove your account and data
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 rounded-full shrink-0"
          >
            <Link to="/travel-settings#delete-account">Delete</Link>
          </Button>
        </div>
      </SectionCard>

      {/* Content Guidelines */}
      <SectionCard
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
      </SectionCard>
    </div>
  );
}
