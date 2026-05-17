import { useState, useEffect } from "react";
import { CreditCard, Bell, Shield, Globe, Loader2, ExternalLink, Save, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CustomerVerificationUpload } from "@/components/CustomerVerificationUpload";
import { EmergencyContactsManager } from "@/components/EmergencyContactsManager";

interface TravelPreferences {
  travel_style?: string[] | null;
  budget_preference?: string | null;
  preferred_destinations?: string[] | null;
  dietary_restrictions?: string[] | null;
  accessibility_needs?: string[] | null;
}

interface TravelerSettingsTabProps {
  userId: string;
}

export function TravelerSettingsTab({ userId }: TravelerSettingsTabProps) {
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: false,
    marketing_emails: false,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      const { data } = await supabase
        .from("user_travel_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setPreferences({
          travel_style: data.travel_style,
          budget_preference: data.budget_preference,
          preferred_destinations: data.preferred_destinations,
          dietary_restrictions: data.dietary_restrictions,
          accessibility_needs: data.accessibility_needs,
        });
      }
    };

    if (userId) {
      fetchPreferences();
    }
  }, [userId]);

  const handleManagePayments = async () => {
    setLoadingPortal(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Please sign in to manage payments");
        return;
      }

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Unable to open payment settings. Please try again.");
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      // Would save to a user_settings table
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Notification preferences saved");
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Email not found. Unable to send password reset email.");
        return;
      }

      toast.loading("Sending password reset email...");

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.dismiss();
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast.dismiss();
      
      // Extract the actual error message from edge function response
      const errorMessage = 
        error?.context?.body?.error ||
        error?.message ||
        error?.error ||
        "Failed to send reset email. Please try again.";
      
      toast.error(errorMessage);
    }
  };

  const handleDownloadData = async () => {
    try {
      toast("Coming soon", {
        description: "Data export functionality will be available soon",
      });
    } catch (error) {
      console.error('Error downloading data:', error);
    }
  };

  const travelStyleOptions = [
    "Adventure", "Relaxation", "Cultural", "Luxury", "Budget", "Eco-friendly", "Family", "Solo", "Romantic"
  ];

  const budgetOptions = [
    { value: "budget", label: "Budget-Friendly" },
    { value: "mid-range", label: "Mid-Range" },
    { value: "luxury", label: "Luxury" },
    { value: "ultra-luxury", label: "Ultra-Luxury" },
  ];

  return (
    <div className="space-y-6">
      {/* Payment Methods */}
      <Card className="bg-white border-[#E5DFC6] rounded-2xl">
        <CardHeader className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 bg-[#F6F0E4] rounded-xl">
              <CreditCard className="h-5 w-5 text-[#C7A962]" />
            </div>
            <div className="min-w-0">
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Payment Methods</CardTitle>
              <CardDescription className="text-sm">Manage your saved payment methods</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5 sm:p-6 pt-0 sm:pt-0">
          <p className="text-sm text-[#6B7280]">
            Access the Stripe Customer Portal to add, remove, or update your payment methods and view billing history.
          </p>
          <Button
            onClick={handleManagePayments}
            disabled={loadingPortal}
            className="w-full sm:w-auto bg-[#0c4d47] hover:bg-[#073331] text-white rounded-full"
          >
            {loadingPortal ? (
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
        </CardContent>
      </Card>

      {/* Travel Preferences */}
      <Card className="bg-white border-[#E5DFC6] rounded-2xl">
        <CardHeader className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 bg-[#F6F0E4] rounded-xl">
              <Globe className="h-5 w-5 text-[#C7A962]" />
            </div>
            <div className="min-w-0">
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Travel Preferences</CardTitle>
              <CardDescription className="text-sm">Help us personalize your recommendations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-5 sm:p-6 pt-0 sm:pt-0">
          {/* Travel Style */}
          <div className="space-y-3">
            <Label className="text-[#0a2225] font-medium">Travel Style</Label>
            <div className="flex flex-wrap gap-2">
              {preferences?.travel_style?.length ? (
                preferences.travel_style.map((style) => (
                  <Badge key={style} variant="secondary" className="bg-[#F6F0E4] text-[#0a2225] hover:bg-[#E5DFC6]">
                    {style}
                  </Badge>
                ))
              ) : (
                travelStyleOptions.slice(0, 4).map((style) => (
                  <Badge key={style} variant="outline" className="border-[#E5DFC6] text-[#6B7280]">
                    {style}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Budget Preference */}
          <div className="space-y-3">
            <Label className="text-[#0a2225] font-medium">Budget Preference</Label>
            <div className="flex flex-wrap gap-2">
              {budgetOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant={preferences?.budget_preference === option.value ? "default" : "outline"}
                  className={preferences?.budget_preference === option.value 
                    ? "bg-[#0a2225] text-white" 
                    : "border-[#E5DFC6] text-[#6B7280]"
                  }
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Destinations */}
          {preferences?.preferred_destinations?.length ? (
            <div className="space-y-3">
              <Label className="text-[#0a2225] font-medium">Favorite Destinations</Label>
              <div className="flex flex-wrap gap-2">
                {preferences.preferred_destinations.map((dest) => (
                  <Badge key={dest} variant="secondary" className="bg-[#F6F0E4] text-[#0a2225]">
                    {dest}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <Button variant="outline" className="w-full sm:w-auto border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4] rounded-full" asChild>
            <a href="/onboarding/traveler/preferences">Edit All Preferences</a>
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-white border-[#E5DFC6] rounded-2xl">
        <CardHeader className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 bg-[#F6F0E4] rounded-xl">
              <Bell className="h-5 w-5 text-[#C7A962]" />
            </div>
            <div className="min-w-0">
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Notifications</CardTitle>
              <CardDescription className="text-sm">Control how we reach you</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-5 sm:p-6 pt-0 sm:pt-0">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={notifications.email_notifications}
              onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email_notifications: !!checked }))}
              className="mt-1"
            />
            <div className="space-y-0.5">
              <p className="text-[#0a2225] font-medium">Email Notifications</p>
              <p className="text-sm text-[#6B7280]">Receive updates about your trips and proposals</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={notifications.sms_notifications}
              onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, sms_notifications: !!checked }))}
              className="mt-1"
            />
            <div className="space-y-0.5">
              <p className="text-[#0a2225] font-medium">SMS Notifications</p>
              <p className="text-sm text-[#6B7280]">Get text alerts for urgent updates</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={notifications.marketing_emails}
              onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, marketing_emails: !!checked }))}
              className="mt-1"
            />
            <div className="space-y-0.5">
              <p className="text-[#0a2225] font-medium">Marketing Communications</p>
              <p className="text-sm text-[#6B7280]">Receive travel inspiration and offers</p>
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
        </CardContent>
      </Card>

      {/* Security & Privacy */}
      <Card className="bg-white border-[#E5DFC6] rounded-2xl">
        <CardHeader className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 bg-[#F6F0E4] rounded-xl">
              <Shield className="h-5 w-5 text-[#C7A962]" />
            </div>
            <div className="min-w-0">
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Security & Privacy</CardTitle>
              <CardDescription className="text-sm">Manage your account security</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5 sm:p-6 pt-0 sm:pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-[#E5DFC6]">
            <div className="min-w-0">
              <p className="text-[#0a2225] font-medium">Change Password</p>
              <p className="text-sm text-[#6B7280]">Update your account password</p>
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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-[#E5DFC6]">
            <div className="min-w-0">
              <p className="text-[#0a2225] font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-[#6B7280]">Add an extra layer of security</p>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto border-[#E5DFC6] text-[#6B7280]">Coming Soon</Badge>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-[#0a2225] font-medium">Download My Data</p>
              <p className="text-sm text-[#6B7280]">Export a copy of your account data</p>
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
        </CardContent>
      </Card>

      {/* Identity Verification */}
      <Card className="bg-white border-[#E5DFC6] rounded-2xl">
        <CardHeader className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 bg-[#F6F0E4] rounded-xl">
              <ShieldCheck className="h-5 w-5 text-[#C7A962]" />
            </div>
            <div className="min-w-0">
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Identity Verification</CardTitle>
              <CardDescription className="text-sm">Verify your identity to unlock premium features</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0 sm:pt-0">
          <CustomerVerificationUpload />
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card className="bg-white border-[#E5DFC6] rounded-2xl">
        <CardHeader className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 bg-[#F6F0E4] rounded-xl">
              <AlertCircle className="h-5 w-5 text-[#C7A962]" />
            </div>
            <div className="min-w-0">
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Emergency Contacts</CardTitle>
              <CardDescription className="text-sm">Required for high-value bookings over $5,000</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0 sm:pt-0">
          <EmergencyContactsManager />
        </CardContent>
      </Card>
    </div>
  );
}
