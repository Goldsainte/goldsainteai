import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CreditCard,
  Database,
  Shield,
  Loader2,
  ExternalLink,
  Save,
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { requestPasswordReset } from "@/lib/auth/requestPasswordReset";

interface SectionShellProps {
  icon: any;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SettingsSectionCard({
  icon: Icon,
  title,
  description,
  children,
}: SectionShellProps) {
  return (
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
}

/* -------------------- Manage Payments -------------------- */

export function ManagePaymentsSection({
  description = "Manage your saved payment methods and billing history.",
}: {
  userId?: string;
  description?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleManagePayments = async () => {
    setLoading(true);
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
          body: { returnUrl: window.location.href },
        },
      );
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Unable to open payment settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsSectionCard
      icon={CreditCard}
      title="Payment Methods"
      description="Manage your saved payment methods"
    >
      <p className="text-sm text-[#6B7280]">{description}</p>
      <Button
        onClick={handleManagePayments}
        disabled={loading}
        className="w-full sm:w-auto bg-[#0c4d47] hover:bg-[#073331] text-white rounded-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage Payments
          </>
        )}
      </Button>
    </SettingsSectionCard>
  );
}

/* -------------------- Notification Preferences -------------------- */

interface NotificationsState {
  email: boolean;
  sms: boolean;
  marketing: boolean;
}

export function NotificationPreferencesSection({
  userId,
  emailLabel = "Receive updates about your trips and proposals",
  smsLabel = "Get text alerts for urgent updates",
  marketingLabel = "Receive travel inspiration and offers",
}: {
  userId: string;
  emailLabel?: string;
  smsLabel?: string;
  marketingLabel?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationsState>({
    email: true,
    sms: false,
    marketing: false,
  });

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("id", userId)
        .maybeSingle();
      if (data?.notification_preferences) {
        const p = data.notification_preferences as Record<string, boolean>;
        setPrefs({
          email: p.email ?? true,
          sms: p.sms ?? false,
          marketing: p.marketing ?? false,
        });
      }
    })();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          notification_preferences: {
            email: prefs.email,
            sms: prefs.sms,
            push: true,
            marketing: prefs.marketing,
          },
        })
        .eq("id", userId);
      if (error) throw error;
      toast.success("Notification preferences saved");
    } catch (error: any) {
      console.error("Save notifications error:", error);
      toast.error(error.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSectionCard
      icon={Bell}
      title="Notifications"
      description="Control how we reach you"
    >
      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={prefs.email}
          onCheckedChange={(c) => setPrefs((p) => ({ ...p, email: !!c }))}
          className="mt-1"
        />
        <div className="space-y-0.5">
          <p className="text-[#0a2225] font-medium">Email Notifications</p>
          <p className="text-sm text-[#6B7280]">{emailLabel}</p>
        </div>
      </label>
      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={prefs.sms}
          onCheckedChange={(c) => setPrefs((p) => ({ ...p, sms: !!c }))}
          className="mt-1"
        />
        <div className="space-y-0.5">
          <p className="text-[#0a2225] font-medium">SMS Notifications</p>
          <p className="text-sm text-[#6B7280]">{smsLabel}</p>
        </div>
      </label>
      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={prefs.marketing}
          onCheckedChange={(c) => setPrefs((p) => ({ ...p, marketing: !!c }))}
          className="mt-1"
        />
        <div className="space-y-0.5">
          <p className="text-[#0a2225] font-medium">Marketing Communications</p>
          <p className="text-sm text-[#6B7280]">{marketingLabel}</p>
        </div>
      </label>
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto bg-[#0c4d47] hover:bg-[#073331] text-white rounded-full"
      >
        {saving ? (
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
    </SettingsSectionCard>
  );
}

/* -------------------- Security -------------------- */

export function SecuritySection() {
  const handleChangePassword = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Email not found. Unable to send password reset email.");
        return;
      }
      toast.loading("Sending password reset email...");
      const result = await requestPasswordReset(user.email);
      if (!result.ok) throw new Error(result.error || "Failed to send reset email.");
      toast.dismiss();
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      console.error("Error sending password reset:", error);
      toast.dismiss();
      const errorMessage =
        error?.context?.body?.error ||
        error?.message ||
        error?.error ||
        "Failed to send reset email. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <SettingsSectionCard
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
    </SettingsSectionCard>
  );
}

/* -------------------- Privacy & Data -------------------- */

export function PrivacyDataSection() {
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
      const { data, error } = await supabase.functions.invoke(
        "export-user-data",
        { method: "POST" },
      );
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
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

  return (
    <SettingsSectionCard
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
    </SettingsSectionCard>
  );
}
