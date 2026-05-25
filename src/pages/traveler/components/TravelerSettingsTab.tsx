import { useState, useEffect } from "react";
import { Globe, ShieldCheck, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CustomerVerificationUpload } from "@/components/CustomerVerificationUpload";
import { EmergencyContactsManager } from "@/components/EmergencyContactsManager";
import {
  SettingsSectionCard,
  ManagePaymentsSection,
  NotificationPreferencesSection,
  SecuritySection,
  PrivacyDataSection,
} from "@/components/settings/SettingsSharedSections";

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

const travelStyleOptions = [
  "Adventure",
  "Relaxation",
  "Cultural",
  "Luxury",
  "Budget",
  "Eco-friendly",
  "Family",
  "Solo",
  "Romantic",
];

const budgetOptions = [
  { value: "budget", label: "Budget-Friendly" },
  { value: "mid-range", label: "Mid-Range" },
  { value: "luxury", label: "Luxury" },
  { value: "ultra-luxury", label: "Ultra-Luxury" },
];

export function TravelerSettingsTab({ userId }: TravelerSettingsTabProps) {
  const [preferences, setPreferences] = useState<TravelPreferences | null>(
    null,
  );

  useEffect(() => {
    if (!userId) return;
    (async () => {
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
    })();
  }, [userId]);

  return (
    <div className="space-y-6">
      {/* Payment Methods (shared) */}
      <ManagePaymentsSection userId={userId} />

      {/* Travel Preferences (traveler-specific) */}
      <SettingsSectionCard
        icon={Globe}
        title="Travel Preferences"
        description="Help us personalize your recommendations"
      >
        <div className="space-y-3">
          <Label className="text-[#0a2225] font-medium">Travel Style</Label>
          <div className="flex flex-wrap gap-2">
            {preferences?.travel_style?.length
              ? preferences.travel_style.map((style) => (
                  <Badge
                    key={style}
                    variant="secondary"
                    className="bg-[#F6F0E4] text-[#0a2225] hover:bg-[#E5DFC6]"
                  >
                    {style}
                  </Badge>
                ))
              : travelStyleOptions.slice(0, 4).map((style) => (
                  <Badge
                    key={style}
                    variant="outline"
                    className="border-[#E5DFC6] text-[#6B7280]"
                  >
                    {style}
                  </Badge>
                ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-[#0a2225] font-medium">
            Budget Preference
          </Label>
          <div className="flex flex-wrap gap-2">
            {budgetOptions.map((option) => (
              <Badge
                key={option.value}
                variant={
                  preferences?.budget_preference === option.value
                    ? "default"
                    : "outline"
                }
                className={
                  preferences?.budget_preference === option.value
                    ? "bg-[#0a2225] text-white"
                    : "border-[#E5DFC6] text-[#6B7280]"
                }
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {preferences?.preferred_destinations?.length ? (
          <div className="space-y-3">
            <Label className="text-[#0a2225] font-medium">
              Favorite Destinations
            </Label>
            <div className="flex flex-wrap gap-2">
              {preferences.preferred_destinations.map((dest) => (
                <Badge
                  key={dest}
                  variant="secondary"
                  className="bg-[#F6F0E4] text-[#0a2225]"
                >
                  {dest}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

      </SettingsSectionCard>

      {/* Notifications (shared) */}
      <NotificationPreferencesSection userId={userId} />

      {/* Security (shared) */}
      <SecuritySection />

      {/* Privacy & Data (shared) */}
      <PrivacyDataSection />

      {/* Identity Verification (traveler-specific) */}
      <Card className="bg-white border-[#E5DFC6] rounded-2xl">
        <CardHeader className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 bg-[#F6F0E4] rounded-xl">
              <ShieldCheck className="h-5 w-5 text-[#C7A962]" />
            </div>
            <div className="min-w-0">
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">
                Identity Verification
              </CardTitle>
              <CardDescription className="text-sm">
                Verify your identity to unlock premium features
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0 sm:pt-0">
          <CustomerVerificationUpload />
        </CardContent>
      </Card>

      {/* Emergency Contacts (traveler-specific) */}
      <Card className="bg-white border-[#E5DFC6] rounded-2xl">
        <CardHeader className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 bg-[#F6F0E4] rounded-xl">
              <AlertCircle className="h-5 w-5 text-[#C7A962]" />
            </div>
            <div className="min-w-0">
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">
                Emergency Contacts
              </CardTitle>
              <CardDescription className="text-sm">
                Required for high-value bookings over $5,000
              </CardDescription>
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
