import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type AccountType = "traveler" | "creator" | "agent" | "brand";

interface Props {
  onComplete: () => void;
}

const roleOptions: { type: AccountType; title: string; description: string }[] = [
  {
    type: "traveler",
    title: "Traveler",
    description: "You want inspiration, trip ideas, and help turning moodboards into real itineraries.",
  },
  {
    type: "creator",
    title: "Creator",
    description: "You make travel content and want hosted stays, brand collabs, and access to Goldsainte trips.",
  },
  {
    type: "agent",
    title: "Travel Agent",
    description: "You design and book trips for clients and want a pipeline of qualified trip requests.",
  },
  {
    type: "brand",
    title: "Brand / Hotel",
    description: "You're a hotel, resort, or lifestyle brand and want a curated presence and insights on Goldsainte.",
  },
];

export function AccountTypeStep({ onComplete }: Props) {
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);

    if (!accountType) {
      setError("Please choose what kind of Goldsainte account you're creating.");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please add a mobile number for account security.");
      return;
    }

    setSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("You need to be signed in to complete your profile.");
        setSaving(false);
        return;
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          account_type: accountType,
          is_profile_complete: accountType !== "brand",
          // Auto-complete onboarding for travelers (no legacy AI intake)
          onboarding_completed: accountType === "traveler" ? true : undefined,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        console.error("Error updating profile", upsertError);
        setError("Could not save your profile. Please try again.");
      } else {
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
        <h2 className="text-xl font-secondary text-[#0a2225]">
          Tell us who you are
        </h2>
        <p className="text-sm text-[#6B7280]">
          Goldsainte works best when we understand your role in the marketplace.
        </p>
      </div>

      {/* Role selection */}
      <div className="grid grid-cols-1 gap-3">
        {roleOptions.map((role) => (
          <button
            key={role.type}
            type="button"
            className={`w-full rounded-2xl border-2 px-5 py-4 text-left transition-all flex flex-col gap-1.5 ${
              accountType === role.type
                ? "border-[#C7A962] bg-[#FDF9F0]"
                : "border-[#E5DFC6] bg-white hover:border-[#BFAD72] hover:bg-[#FDF9F0]/50"
            }`}
            onClick={() => setAccountType(role.type)}
          >
            <div className="font-secondary text-base text-[#0a2225]">{role.title}</div>
            <div className="text-sm text-[#6B7280] leading-relaxed">
              {role.description}
            </div>
          </button>
        ))}
      </div>

      {/* Basic identity fields */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium text-[#0a2225]">
            First name
          </Label>
          <Input
            id="firstName"
            placeholder="Jordan"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20 rounded-xl h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium text-[#0a2225]">
            Last name
          </Label>
          <Input
            id="lastName"
            placeholder="Smith"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20 rounded-xl h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-[#0a2225]">
          Mobile number
        </Label>
        <Input
          id="phone"
          placeholder="+1 (555) 000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20 rounded-xl h-11"
        />
        <p className="text-xs text-[#6B7280]">
          Used for security and important updates about your trips and brand activity.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200" role="alert">
          {error}
        </p>
      )}

      {/* CTA Button */}
      <Button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] py-3 h-12 text-base font-semibold"
      >
        {saving ? "Saving profile…" : "Continue to Goldsainte"}
      </Button>
    </div>
  );
}
