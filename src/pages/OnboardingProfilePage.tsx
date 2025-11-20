import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getPostAuthDestination } from "@/lib/auth/postAuthRouting";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

type AccountType = "traveler" | "creator" | "agent" | "brand";

export default function OnboardingProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) {
        sessionStorage.setItem('returnTo', '/onboarding/profile');
        navigate("/auth?returnTo=/onboarding/profile", { replace: true });
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(profileError);
        }

        if (profile) {
          if (profile.onboarding_completed) {
        const destination = getPostAuthDestination(
          profile.account_type,
          profile.onboarding_completed
        );
            navigate(destination, { replace: true });
            return;
          }

          if (!cancelled) {
            setAccountType(profile.account_type as AccountType | null);
            setFullName(profile.full_name || "");
            setDisplayName(profile.display_name || "");
            setTiktokHandle(profile.tiktok_handle || "");
            setAgencyName(profile.agency_name || "");
            setBio(profile.bio || "");
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Could not load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate, location]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountType) {
      setError("Please choose whether you are a traveler, creator, or agent.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        sessionStorage.setItem('returnTo', '/onboarding/profile');
        navigate("/auth?returnTo=/onboarding/profile", { replace: true });
        return;
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          account_type: accountType,
          onboarding_completed: true,
          full_name: fullName || null,
          display_name: displayName || fullName || null,
          tiktok_handle: accountType === "creator" ? tiktokHandle || null : null,
          agency_name: accountType === "agent" ? agencyName || null : null,
          bio: bio || null,
        });

      if (upsertError) throw upsertError;

      // Phase 2: Insert role into secure user_roles table
      const roleMapping = {
        'traveler': 'user' as const,
        'creator': 'brand' as const,
        'agent': 'agent' as const,
      };

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: roleMapping[accountType],
        });

      if (roleError && roleError.code !== '23505') {
        // Ignore duplicate key errors (user already has this role)
        console.error('Failed to set user role:', roleError);
      }

      await supabase.auth.updateUser({
        data: { account_type: accountType },
      });

      // Send welcome email via edge function
      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: {
            email: user.email,
            accountType,
            fullName: fullName || null,
            displayName: displayName || fullName || null,
          },
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't block onboarding if email fails
      }

      // Navigate based on role using centralized routing
      const destination = getPostAuthDestination(accountType);
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a2225] text-[#E5DFC6] flex items-center justify-center">
        <p className="text-xs">Preparing your Goldsainte onboarding…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a2225] via-[#0a2225] to-[#E5DFC6] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl rounded-3xl bg-black/60 border border-[#BFAD72]/40 px-5 py-6 text-[#E5DFC6] space-y-5 shadow-lg">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 text-[11px] text-[#BFAD72] font-semibold">
            <Sparkles className="h-3 w-3" />
            Goldsainte onboarding
          </div>
          <h1 className="text-lg font-semibold">
            Tell us how you travel with Goldsainte
          </h1>
          <p className="text-[11px] text-[#E5DFC6]/80">
            Choose your role and set up a short profile. This helps us match the
            right travelers, creators, and agents — and keeps the marketplace
            safe and curated.
          </p>
        </header>

        <form onSubmit={handleSave} className="space-y-4 text-[11px]">
          <div className="space-y-2">
            <p className="font-semibold">How are you using Goldsainte?</p>
            <div className="grid gap-2 md:grid-cols-3">
              <RoleCard
                label="Traveler"
                description="Post trips and book creator + agent journeys."
                selected={accountType === "traveler"}
                onClick={() => setAccountType("traveler")}
              />
              <RoleCard
                label="Creator"
                description="Design TikTok-ready storyboards and co-sell trips."
                selected={accountType === "creator"}
                onClick={() => setAccountType("creator")}
              />
              <RoleCard
                label="Travel agent"
                description="Plug in contracts, logistics, and bookable inventory."
                selected={accountType === "agent"}
                onClick={() => setAccountType("agent")}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span>Full name</span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl bg-black/50 border border-[#E5DFC6]/30 px-3 py-2 text-[11px] outline-none"
                  placeholder="Your legal name"
                />
              </label>
              <label className="space-y-1">
                <span>Public display name</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-2xl bg-black/50 border border-[#E5DFC6]/30 px-3 py-2 text-[11px] outline-none"
                  placeholder="How you'd like to appear"
                />
              </label>
            </div>

            {accountType === "creator" && (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span>TikTok handle</span>
                  <input
                    type="text"
                    value={tiktokHandle}
                    onChange={(e) => setTiktokHandle(e.target.value)}
                    className="w-full rounded-2xl bg-black/50 border border-[#E5DFC6]/30 px-3 py-2 text-[11px] outline-none"
                    placeholder="@yourhandle"
                  />
                </label>
              </div>
            )}

            {accountType === "agent" && (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span>Agency name</span>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full rounded-2xl bg-black/50 border border-[#E5DFC6]/30 px-3 py-2 text-[11px] outline-none"
                    placeholder="Your agency or brand"
                  />
                </label>
              </div>
            )}

            <label className="space-y-1">
              <span>Short bio</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-2xl bg-black/50 border border-[#E5DFC6]/30 px-3 py-2 text-[11px] outline-none"
                placeholder={
                  accountType === "creator"
                    ? "What kind of travel content do you create? Destinations, vibe, audience…"
                    : accountType === "agent"
                    ? "What do you specialize in as an agent? Destinations, clientele, strengths…"
                    : "How do you like to travel? Styles, favorite destinations, non-negotiables…"
                }
              />
            </label>
          </div>

          {error && (
            <p className="text-[11px] text-red-300 bg-red-950/40 border border-red-500/40 rounded-2xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[#BFAD72] text-[#0a2225] px-3 py-2 text-[11px] font-semibold hover:bg-[#d4c58d] disabled:opacity-50"
          >
            {saving ? "Saving your profile…" : "Finish onboarding"}
          </button>

          <p className="text-[10px] text-[#E5DFC6]/70">
            By continuing, you agree to keep conversations and bookings on
            Goldsainte so we can protect travelers and partners on both sides.
          </p>
        </form>
      </div>
    </main>
  );
}

function RoleCard({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl p-3 border text-[11px] transition ${
        selected
          ? "bg-[#0c4d47] border-[#BFAD72] text-[#E5DFC6]"
          : "bg-black/40 border-[#E5DFC6]/30 text-[#E5DFC6]/80 hover:border-[#BFAD72]/60"
      }`}
    >
      <p className="font-semibold">{label}</p>
      <p className="text-[10px] mt-1">{description}</p>
    </button>
  );
}
