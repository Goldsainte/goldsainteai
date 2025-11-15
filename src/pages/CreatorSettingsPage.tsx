import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { toast } from "@/components/ui/use-toast";

type CreatorProfileForm = {
  displayName: string;
  handle: string;
  avatarUrl: string;
  bio: string;
  primaryNiches: string;  // comma-separated for UI
  primaryRegions: string; // comma-separated for UI
  tiktokHandle: string;
  tiktokUrl: string;
};

const EMPTY_FORM: CreatorProfileForm = {
  displayName: "",
  handle: "",
  avatarUrl: "",
  bio: "",
  primaryNiches: "",
  primaryRegions: "",
  tiktokHandle: "",
  tiktokUrl: "",
};

export default function CreatorSettingsPage() {
  const [form, setForm] = useState<CreatorProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);

      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData.user) {
          if (!isMounted) return;
          toast({
            variant: "destructive",
            title: "Authentication required",
            description: "You must be logged in to edit your creator settings.",
          });
          setLoading(false);
          return;
        }

        const creatorId = userData.user.id;

        const { data, error } = await invokeWithAuth("get-creator-profile", {
          body: { creatorId },
        });

        if (error) {
          console.error("Error loading creator profile:", error);
          if (!isMounted) return;
          // No profile yet is not a hard error - user can fill out form
          setLoading(false);
          return;
        }

        if (!isMounted || !data) {
          setLoading(false);
          return;
        }

        const creator = (data as any).creator;
        if (!creator) {
          setLoading(false);
          return;
        }

        const primaryNiches = (creator.primaryNiches ?? []).join(", ");
        const primaryRegions = (creator.primaryRegions ?? []).join(", ");

        setForm({
          displayName: creator.name ?? "",
          handle: creator.handle ?? "",
          avatarUrl: creator.avatarUrl ?? "",
          bio: creator.bio ?? "",
          primaryNiches,
          primaryRegions,
          tiktokHandle: creator.tiktokHandle ?? "",
          tiktokUrl: creator.tiktokUrl ?? "",
        });
      } catch (e: any) {
        console.error("Unexpected error loading profile:", e);
        if (!isMounted) return;
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unexpected error while loading profile.",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField<K extends keyof CreatorProfileForm>(
    key: K,
    value: CreatorProfileForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const primaryNiches = form.primaryNiches
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const primaryRegions = form.primaryRegions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        displayName: form.displayName || null,
        handle: form.handle || null,
        avatarUrl: form.avatarUrl || null,
        bio: form.bio || null,
        primaryNiches,
        primaryRegions,
        tiktokHandle: form.tiktokHandle || null,
        tiktokUrl: form.tiktokUrl || null,
      };

      const { data, error: fnError } = await invokeWithAuth(
        "upsert-creator-profile",
        {
          body: payload,
        }
      );

      if (fnError) {
        console.error("Error saving profile:", fnError);
        toast({
          variant: "destructive",
          title: "Error",
          description: fnError || "Something went wrong while saving your creator profile.",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Creator profile updated successfully.",
      });
    } catch (e: any) {
      console.error("Unexpected error saving profile:", e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unexpected error while saving profile.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Creator Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This is how you appear to agents and travelers on Goldsainte, and
            how we connect your TikTok presence.
          </p>
        </header>

        <section className="mt-6 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
          {loading ? (
            <div className="text-sm text-muted-foreground">
              Loading your creator profile…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Basic identity */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Display name
                </label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => updateField("displayName", e.target.value)}
                  placeholder="e.g., Travel with Maya"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-muted-foreground">
                  This name appears on your creator profile and trip cards.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Creator handle
                </label>
                <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-2">
                  <span className="text-xs text-muted-foreground">@</span>
                  <input
                    type="text"
                    value={form.handle}
                    onChange={(e) => updateField("handle", e.target.value)}
                    placeholder="travelwithmaya"
                    className="w-full border-none bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  This becomes your Goldsainte handle (must be unique).
                </p>
              </div>

              {/* Avatar */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Avatar image URL
                </label>
                <input
                  type="text"
                  value={form.avatarUrl}
                  onChange={(e) => updateField("avatarUrl", e.target.value)}
                  placeholder="https://images.pexels.com/photos/..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-muted-foreground">
                  We'll show this as your profile photo. You can change this to
                  an uploaded image later.
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Bio
                </label>
                <textarea
                  rows={4}
                  value={form.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  placeholder="Tell agents and travelers what kind of trips you create and who you love to serve."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Niches & Regions */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Primary niches
                </label>
                <input
                  type="text"
                  value={form.primaryNiches}
                  onChange={(e) =>
                    updateField("primaryNiches", e.target.value)
                  }
                  placeholder="e.g., Couples, Luxury Europe, Honeymoons"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-muted-foreground">
                  Separate with commas. This helps agents and travelers find
                  you.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Primary regions
                </label>
                <input
                  type="text"
                  value={form.primaryRegions}
                  onChange={(e) =>
                    updateField("primaryRegions", e.target.value)
                  }
                  placeholder="e.g., Europe, SE Asia, Caribbean"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* TikTok */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  TikTok handle
                </label>
                <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-2">
                  <span className="text-xs text-muted-foreground">@</span>
                  <input
                    type="text"
                    value={form.tiktokHandle}
                    onChange={(e) =>
                      updateField("tiktokHandle", e.target.value)
                    }
                    placeholder="travelwithmaya"
                    className="w-full border-none bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  TikTok profile URL
                </label>
                <input
                  type="text"
                  value={form.tiktokUrl}
                  onChange={(e) => updateField("tiktokUrl", e.target.value)}
                  placeholder="https://www.tiktok.com/@yourhandle"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Saving…" : "Save creator settings"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
