import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type AccountType = "traveler" | "creator" | "agent" | "brand";

interface Props {
  onComplete: () => void;
}

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
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        console.error("Error updating profile", upsertError);
        setError("Could not save your profile. Please try again.");
      } else {
        // For brands, create placeholder brand_profiles entry
        if (accountType === "brand") {
          const { error: brandError } = await supabase
            .from("brand_profiles")
            .insert({
              owner_user_id: user.id,
              brand_name: `${firstName.trim()} ${lastName.trim()}`,
            });
          
          if (brandError && brandError.code !== '23505') {
            console.error("Error creating brand profile:", brandError);
            // Continue anyway - they can complete brand onboarding later
          }
        }
        
        onComplete();
      }
    } finally {
      setSaving(false);
    }
  };

  const baseButton =
    "flex-1 rounded-2xl border px-3 py-2 text-xs text-left transition-all flex flex-col gap-1";

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Tell us who you are
        </h2>
        <p className="text-xs text-muted-foreground">
          Goldsainte works best when we understand your role in the marketplace.
        </p>
      </div>

      {/* Role selection */}
      <div className="grid grid-cols-1 gap-2 text-xs">
        <button
          type="button"
          className={`${baseButton} ${
            accountType === "traveler"
              ? "border-primary bg-primary/5"
              : "border-border bg-card"
          }`}
          onClick={() => setAccountType("traveler")}
        >
          <div className="font-medium">Traveler</div>
          <div className="text-[11px] text-muted-foreground">
            You want inspiration, trip ideas, and help turning moodboards into real itineraries.
          </div>
        </button>

        <button
          type="button"
          className={`${baseButton} ${
            accountType === "creator"
              ? "border-primary bg-primary/5"
              : "border-border bg-card"
          }`}
          onClick={() => setAccountType("creator")}
        >
          <div className="font-medium">Creator</div>
          <div className="text-[11px] text-muted-foreground">
            You make travel content and want hosted stays, brand collabs, and access to Goldsainte trips.
          </div>
        </button>

        <button
          type="button"
          className={`${baseButton} ${
            accountType === "agent"
              ? "border-primary bg-primary/5"
              : "border-border bg-card"
          }`}
          onClick={() => setAccountType("agent")}
        >
          <div className="font-medium">Travel Agent</div>
          <div className="text-[11px] text-muted-foreground">
            You design and book trips for clients and want a pipeline of qualified trip requests.
          </div>
        </button>

        <button
          type="button"
          className={`${baseButton} ${
            accountType === "brand"
              ? "border-primary bg-primary/5"
              : "border-border bg-card"
          }`}
          onClick={() => setAccountType("brand")}
        >
          <div className="font-medium">Brand / Hotel</div>
          <div className="text-[11px] text-muted-foreground">
            You&apos;re a hotel, resort, or lifestyle brand and want a curated presence, collections, and performance insights on Goldsainte.
          </div>
        </button>
      </div>

      {/* Basic identity fields */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            placeholder="Jordan"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            placeholder="Smith"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="phone">Mobile number</Label>
        <Input
          id="phone"
          placeholder="+1 (555) 000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground">
          Used for security and important updates about your trips and brand activity.
        </p>
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-full text-sm font-semibold"
      >
        {saving ? "Saving profile…" : "Continue to Goldsainte"}
      </Button>
    </div>
  );
}
