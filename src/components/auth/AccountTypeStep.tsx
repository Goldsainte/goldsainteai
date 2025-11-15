import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type AccountType = "traveler" | "creator" | "agent";

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
          is_profile_complete: true,
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

  const baseButton =
    "flex-1 rounded-2xl border px-3 py-2 text-xs text-left transition-all";

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Tell us who you are
        </h2>
        <p className="text-xs text-muted-foreground">
          Goldsainte works best when we know your role in the marketplace.
        </p>
      </div>

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
            You want to post trips, get matched with agents and creators, and book experiences.
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
          <div className="font-medium">TikTok Creator</div>
          <div className="text-[11px] text-muted-foreground">
            You create travel content and want to collaborate with agents to sell trips.
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
            You're a certified travel professional selling and managing trips.
          </div>
        </button>
      </div>

      <div className="grid gap-2 text-xs">
        <div className="grid gap-1">
          <Label>First name</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Taylor"
          />
        </div>
        <div className="grid gap-1">
          <Label>Last name</Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="West"
          />
        </div>
        <div className="grid gap-1">
          <Label>Mobile number</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 555 5555"
          />
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
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
