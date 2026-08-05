import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Building2,
  CreditCard,
  FileText,
  Scale,
  Loader2,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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

interface AgencyInfo {
  agency_name: string | null;
  business_type: string | null;
  license_number: string | null;
  accreditations: string | null;
  years_experience: number | null;
  status: string | null;
}

type DisputePref = "platform_mediation" | "direct_first" | "auto_refund";

export function AgentSettingsTab() {
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [savingDispute, setSavingDispute] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [agency, setAgency] = useState<AgencyInfo | null>(null);
  const [disputePref, setDisputePref] = useState<DisputePref>(
    "platform_mediation",
  );

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("dispute_preference")
        .eq("id", user.id)
        .maybeSingle();
      if ((profile as any)?.dispute_preference) {
        setDisputePref((profile as any).dispute_preference as DisputePref);
      }

      const { data: app } = await supabase
        .from("agent_applications")
        .select(
          "agency_name, business_type, license_number, accreditations, years_experience, status",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (app) setAgency(app as AgencyInfo);

      try {
        const { data } = await supabase.functions.invoke(
          "check-creator-stripe-status",
        );
        if (data) setStripeStatus(data as StripeStatus);
      } catch (e) {
        console.warn("Stripe status fetch failed", e);
      }
    })();
  }, []);

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
      toast.error(e.message || t("dash.c.stripeOnboardFailed", "Failed to start Stripe onboarding"));
    } finally {
      setLoadingStripe(false);
    }
  };

  const handleSaveDispute = async () => {
    if (!userId) return;
    setSavingDispute(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ dispute_preference: disputePref } as any)
        .eq("id", userId);
      if (error) throw error;
      toast.success(t("dash.a.disputeSaved", "Dispute preferences saved"));
    } catch (error: any) {
      console.error("Save dispute error:", error);
      toast.error(error.message || t("dash.a.disputeSaveFailed", "Failed to save dispute preferences"));
    } finally {
      setSavingDispute(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="space-y-6">
      {/* Account & Profile */}
      <SettingsSectionCard
        icon={User}
        title={t("dash.c.accountProfile", "Account & Profile")}
        description={t("dash.c.accountProfileDesc", "Manage your username, avatar, and bio")}
      >
        <p className="text-sm text-[#6B7280]">
          {t("dash.a.editProfileBody", "Edit your display name, profile photo, and personal details.")}
        </p>
        <Button
          asChild
          variant="outline"
          className="w-full sm:w-auto border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4] rounded-full"
        >
          <Link to="/travel-settings">
            <ExternalLink className="h-4 w-4 mr-2" />
            {t("dash.c.editProfile", "Edit Profile")}
          </Link>
        </Button>
      </SettingsSectionCard>

      {/* Agency Information */}
      <SettingsSectionCard
        icon={Building2}
        title={t("dash.a.agencyInfo", "Agency Information")}
        description={t("dash.a.agencyInfoDesc", "Business details from your travel agent application")}
      >
        {agency ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#6B7280]">{t("dash.a.agencyName", "Agency Name")}</p>
              <p className="text-[#0a2225] font-medium">
                {agency.agency_name || "—"}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">{t("dash.a.businessType", "Business Type")}</p>
              <p className="text-[#0a2225] font-medium capitalize">
                {agency.business_type || "—"}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">{t("dash.a.licenseNumber", "License Number")}</p>
              <p className="text-[#0a2225] font-medium">
                {agency.license_number || "—"}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">{t("dash.a.accreditations", "Accreditations")}</p>
              <p className="text-[#0a2225] font-medium">
                {agency.accreditations || "—"}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">{t("dash.a.yearsExperience", "Years of Experience")}</p>
              <p className="text-[#0a2225] font-medium">
                {agency.years_experience ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">{t("dash.a.applicationStatus", "Application Status")}</p>
              <Badge className="bg-[#F6F0E4] text-[#0a2225] capitalize">
                {agency.status || "—"}
              </Badge>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#6B7280]">
            {t("dash.a.noApplication", "No agent application found on file.")}
          </p>
        )}
        <Button
          asChild
          variant="outline"
          className="w-full sm:w-auto border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4] rounded-full"
        >
          <Link to="/apply/agent">
            <ExternalLink className="h-4 w-4 mr-2" />
            {t("dash.a.updateAgencyDetails", "Update Agency Details")}
          </Link>
        </Button>
      </SettingsSectionCard>

      {/* Payouts & Stripe Connect */}
      <SettingsSectionCard
        icon={CreditCard}
        title={t("dash.c.payoutsStripe", "Payouts & Stripe Connect")}
        description={t("dash.c.payoutsStripeDesc", "Manage payouts and connected account")}
      >
        {stripeStatus?.connected ? (
          <div className="flex items-center gap-2 text-sm">
            {stripeStatus.payouts_enabled ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-[#0c4d47]" />
                <span className="text-[#0a2225] font-medium">
                  {t("dash.c.payoutsEnabled", "Payouts enabled")}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-[#0a2225] font-medium">
                  {t("dash.c.onboardingIncomplete", "Onboarding incomplete")}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#6B7280]">
              {t("dash.a.connectStripeBookings", "Connect your Stripe account to receive payouts from confirmed bookings.")}
            </p>
            <Button
              onClick={handleConnectStripe}
              disabled={loadingStripe}
              className="w-full sm:w-auto bg-[#0c4d47] hover:bg-[#073331] text-white rounded-full"
            >
              {loadingStripe ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {t("chk.stripeC", "Connect Stripe")}
            </Button>
          </div>
        )}
      </SettingsSectionCard>

      {/* Notifications */}
      <NotificationPreferencesSection
        userId={userId}
        emailLabel={t("dash.a.notifEmail", "New jobs, bids, bookings, and payout updates")}
        smsLabel={t("dash.a.notifSms", "Text alerts for urgent traveler messages")}
        marketingLabel={t("dash.a.notifMkt", "Product updates and agent program news")}
      />

      {/* Security */}
      <SecuritySection />

      {/* Tax & Credentials */}
      <SettingsSectionCard
        icon={FileText}
        title={t("dash.a.taxCredentials", "Tax & Credentials")}
        description={t("dash.a.taxCredentialsDesc", "Tax forms and agent requirements")}
      >
        <p className="text-sm text-[#6B7280]">
          {t("dash.a.taxCredBody", "Review tax obligations and credential requirements for agents on Goldsainte.")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="outline"
            className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4] rounded-full"
          >
            <Link to="/help/agent-requirements">
              <ExternalLink className="h-4 w-4 mr-2" />
              {t("dash.a.agentRequirements", "Agent Requirements")}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4] rounded-full"
          >
            <Link to="/help/tax-information">
              <ExternalLink className="h-4 w-4 mr-2" />
              {t("dash.c.taxInfo", "Tax Information")}
            </Link>
          </Button>
        </div>
      </SettingsSectionCard>

      {/* Privacy & Data */}
      <PrivacyDataSection />

      {/* Dispute Settings */}
      <SettingsSectionCard
        icon={Scale}
        title={t("dash.a.disputeSettings", "Dispute Settings")}
        description={t("dash.a.disputeSettingsDesc", "How traveler disputes should be handled")}
      >
        <RadioGroup
          value={disputePref}
          onValueChange={(v) => setDisputePref(v as DisputePref)}
          className="space-y-3"
        >
          <div className="flex items-start gap-3">
            <RadioGroupItem
              value="platform_mediation"
              id="dispute-platform"
              className="mt-1"
            />
            <Label
              htmlFor="dispute-platform"
              className="cursor-pointer space-y-0.5"
            >
              <p className="text-[#0a2225] font-medium">{t("dash.a.platformMediation", "Platform mediation")}</p>
              <p className="text-sm text-[#6B7280]">
                {t("dash.a.mediationRec", "Goldsainte mediates from the start (recommended)")}
              </p>
            </Label>
          </div>
          <div className="flex items-start gap-3">
            <RadioGroupItem
              value="direct_first"
              id="dispute-direct"
              className="mt-1"
            />
            <Label
              htmlFor="dispute-direct"
              className="cursor-pointer space-y-0.5"
            >
              <p className="text-[#0a2225] font-medium">
                {t("dash.a.directFirst", "Attempt direct resolution first")}
              </p>
              <p className="text-sm text-[#6B7280]">
                {t("dash.a.directFirstDesc", "Try to resolve directly with the traveler before escalating")}
              </p>
            </Label>
          </div>
          <div className="flex items-start gap-3">
            <RadioGroupItem
              value="auto_refund"
              id="dispute-refund"
              className="mt-1"
            />
            <Label
              htmlFor="dispute-refund"
              className="cursor-pointer space-y-0.5"
            >
              <p className="text-[#0a2225] font-medium">
                {t("dash.a.autoApprove", "Auto-approve refunds under threshold")}
              </p>
              <p className="text-sm text-[#6B7280]">
                {t("dash.a.autoApproveDesc", "Automatically approve refund requests below your minimum booking value")}
              </p>
            </Label>
          </div>
        </RadioGroup>
        <Button
          onClick={handleSaveDispute}
          disabled={savingDispute}
          className="w-full sm:w-auto bg-[#0c4d47] hover:bg-[#073331] text-white rounded-full"
        >
          {savingDispute ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("dash.a.savingEllipsis", "Saving...")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t("dash.a.saveDispute", "Save Dispute Preferences")}
            </>
          )}
        </Button>
      </SettingsSectionCard>
    </div>
  );
}
