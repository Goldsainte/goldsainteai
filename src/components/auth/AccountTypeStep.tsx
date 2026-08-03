import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type AccountType = "traveler" | "creator" | "agent" | "brand";

interface Props {
  onComplete: () => void;
  defaultType?: AccountType;
}

type RoleT = (key: string, defaultValue: string) => string;
const roleOptions = (t: RoleT): { type: AccountType; title: string; description: string }[] => [
  {
    type: "traveler",
    title: t("auth.roleTraveler", "Traveler"),
    description: t("auth.roleTravelerD", "You want inspiration, trip ideas, and help turning moodboards into real itineraries."),
  },
  {
    type: "creator",
    title: t("auth.roleCreator", "Creator"),
    description: t("auth.roleCreatorD", "You make travel content and want hosted stays, brand collabs, and access to Goldsainte trips."),
  },
  {
    type: "agent",
    title: t("auth.roleAgent", "Travel Agent"),
    description: t("auth.roleAgentD", "You design and book trips for clients and want a pipeline of qualified trip requests."),
  },
];

export function AccountTypeStep({ onComplete, defaultType }: Props) {
  const { t } = useTranslation();
  const [accountType, setAccountType] = useState<AccountType | null>(defaultType ?? null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function prefillFromSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      if (fullName && !firstName) {
        const parts = fullName.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
    }
    prefillFromSession();
  }, []);

  const handleSave = async () => {
    setError(null);

    if (!accountType) {
      setError(t('auth.vChooseKind', "Please choose what kind of Goldsainte account you're creating."));
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError(t('auth.vEnterName', "Please enter your first and last name."));
      return;
    }

    setSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError(t('auth.vSignedIn', "You need to be signed in to complete your profile."));
        setSaving(false);
        return;
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          account_type: accountType,
          is_profile_complete: accountType !== "brand",
          // Auto-complete onboarding for travelers (no legacy AI intake)
          onboarding_completed: accountType === "traveler" ? true : undefined,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        console.error("Error updating profile", upsertError);
        setError(t('auth.vSaveFailed', "Could not save your profile. Please try again."));
      } else {
        // Fire one-time welcome email for travelers (idempotent per user id).
        if (accountType === "traveler" && user.email) {
          supabase.functions
            .invoke("send-transactional-email", {
              body: {
                templateName: "welcome-traveler",
                recipientEmail: user.email,
                idempotencyKey: `welcome-traveler-${user.id}`,
                templateData: { name: firstName.trim() || undefined },
              },
            })
            .catch((e) => console.error("welcome-traveler email failed:", e));
        }
        onComplete();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="space-y-1">
        <h2 className="text-xl font-secondary text-[#0a2225]">{t('auth.tellUsWho', "Tell us who you are")}</h2>
        <p className="text-sm text-[#6B7280]">
          {t('auth.tellUsWhoSub', "Goldsainte works best when we understand your role in the marketplace.")}
        </p>
      </div>

      {/* Two-column on desktop: roles left, identity right */}
      <div className="md:grid md:grid-cols-2 md:gap-8 space-y-6 md:space-y-0">

        {/* Role selection */}
        <div className="flex flex-col gap-3">
          {roleOptions(t).map((role) => {
            const isSelected = accountType === role.type;
            return (
              <button
                key={role.type}
                type="button"
                className={`w-full rounded-2xl border-2 px-5 py-4 text-left transition-all flex flex-col gap-1 ${
                  isSelected
                    ? 'border-[#C7A962] bg-[#FDF9F0]'
                    : 'border-[#E5DFC6] bg-white hover:border-[#BFAD72] hover:bg-[#FDF9F0]/50'
                }`}
                onClick={() => setAccountType(role.type)}
              >
                <div className="font-secondary text-base text-[#0a2225] flex items-center gap-2">
                  {isSelected && (
                    <span className="inline-block w-2 h-2 rounded-full bg-[#C7A962] shrink-0" />
                  )}
                  {role.title}
                </div>
                {/* Show description only for selected role to reduce noise */}
                {isSelected && (
                  <div className="text-sm text-[#6B7280] leading-relaxed pl-4">
                    {role.description}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Identity fields */}
        <div className="flex flex-col gap-4 justify-start">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-[#0a2225]">
                {t('auth.firstName', "First name")}
              </Label>
              <Input
                id="firstName"
                placeholder={t('auth.firstNamePh', "Jordan")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20 rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-[#0a2225]">
                {t('auth.lastName', "Last name")}
              </Label>
              <Input
                id="lastName"
                placeholder={t('auth.lastNamePh', "Smith")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20 rounded-xl h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-[#0a2225]">
              {t('auth.mobileNumber', "Mobile number")} <span className="font-normal text-[#6B7280]">{t('auth.optionalParen', "(optional)")}</span>
            </Label>
            <Input
              id="phone"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20 rounded-xl h-11"
            />
            <p className="text-xs text-[#6B7280]">{t('auth.addLaterNote', "You can add this later from your profile settings.")}</p>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <Button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] py-3 h-12 text-base font-semibold"
      >
        {saving ? t('auth.savingProfile', "Saving profile…") : t('auth.continueToGoldsainte', "Continue to Goldsainte")}
      </Button>
    </div>
  );
}
