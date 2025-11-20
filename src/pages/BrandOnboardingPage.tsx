import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Step = 1 | 2 | 3;

export default function BrandOnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <p className="text-sm text-[#4a4a4a]">
          You need to be signed in to onboard as a brand.
        </p>
      </div>
    );
  }

  const toggleInArray = (
    value: string,
    arr: string[],
    setter: (val: string[]) => void
  ) => {
    if (arr.includes(value)) {
      setter(arr.filter((v) => v !== value));
    } else {
      setter([...arr, value]);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      // 1) Update profile with correct column names
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          bio,
          creator_niches: categories,
          destinations_focus_tags: regions,
          content_style_tags: styleTags,
          website: website || null,
          account_type: "brand",
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 2) Ensure user_roles has brand
      const { error: roleError } = await supabase.from("user_roles").upsert(
        {
          user_id: user.id,
          role: "brand",
        },
        { onConflict: "user_id,role" }
      );

      if (roleError) throw roleError;

      // Done – send them to brand console
      navigate("/console/brand");
    } catch (err: any) {
      console.error(err);
      setError("We couldn't complete your brand onboarding. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const suggestedCategories = [
    "Luxury Hotel",
    "Resort",
    "Eco Travel",
    "Private Villas",
    "Luggage",
    "Fashion",
    "Wellness Retreat",
    "Adventure",
    "Culinary",
  ];

  const suggestedRegions = [
    "Europe",
    "Caribbean",
    "North America",
    "South America",
    "Africa",
    "Middle East",
    "Asia",
    "Oceania",
  ];

  const suggestedStyleTags = [
    "Upcycled",
    "Sustainable",
    "Minimalist",
    "Maximalist",
    "Urban",
    "Coastal",
    "Island",
    "Alpine",
    "Airport to Aperitivo",
    "Family Friendly",
  ];

  return (
    <>
      <Helmet>
        <title>Brand Onboarding · Goldsainte</title>
      </Helmet>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-1 font-display text-2xl text-[#0a2225]">
          Join Goldsainte as a Brand
        </h1>
        <p className="mb-6 text-sm text-[#4a4a4a]">
          Help travelers discover your world through inspiration, moodboards, and
          curated experiences—then convert that inspiration into real trips and
          purchases.
        </p>

        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-wide text-[#7A7151]">
          <span
            className={`h-1 flex-1 rounded-full ${
              step >= 1 ? "bg-[#BFAD72]" : "bg-[#E5DFC6]"
            }`}
          />
          <span
            className={`h-1 flex-1 rounded-full ${
              step >= 2 ? "bg-[#BFAD72]" : "bg-[#E5DFC6]"
            }`}
          />
          <span
            className={`h-1 flex-1 rounded-full ${
              step >= 3 ? "bg-[#BFAD72]" : "bg-[#E5DFC6]"
            }`}
          />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                Brand name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E5DFC6] px-3 py-2 text-sm text-[#0a2225] focus:outline-none focus:ring-1 focus:ring-[#BFAD72]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                Short description
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-[#E5DFC6] px-3 py-2 text-sm text-[#0a2225] focus:outline-none focus:ring-1 focus:ring-[#BFAD72]"
                placeholder="For example: A sustainable resort brand focused on slow travel, coastal escapes, and upcycled design."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                Website (optional)
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E5DFC6] px-3 py-2 text-sm text-[#0a2225] focus:outline-none focus:ring-1 focus:ring-[#BFAD72]"
                placeholder="https://"
              />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                What type of brand are you?
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedCategories.map((c) => {
                  const active = categories.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        toggleInArray(c, categories, setCategories)
                      }
                      className={`rounded-full border px-3 py-1 text-xs ${
                        active
                          ? "border-[#0a2225] bg-[#0a2225] text-[#E5DFC6]"
                          : "border-[#E5DFC6] bg-white text-[#4a4a4a]"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                Where do you operate?
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedRegions.map((r) => {
                  const active = regions.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleInArray(r, regions, setRegions)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        active
                          ? "border-[#0a2225] bg-[#0a2225] text-[#E5DFC6]"
                          : "border-[#E5DFC6] bg-white text-[#4a4a4a]"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                What best describes your aesthetic and values?
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedStyleTags.map((tag) => {
                  const active = styleTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInArray(tag, styleTags, setStyleTags)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        active
                          ? "border-[#0a2225] bg-[#0a2225] text-[#E5DFC6]"
                          : "border-[#E5DFC6] bg-white text-[#4a4a4a]"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[#E5DFC6] bg-[#F5F0E0] px-4 py-3 text-xs text-[#4a4a4a]">
              These tags help Goldsainte AI match you with travelers building
              moodboards around sustainability, aesthetics, regions, and travel
              style. Think of it as your "Pinterest DNA" inside Goldsainte.
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-xs text-red-600">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev))}
            disabled={step === 1 || saving}
            className="rounded-full border border-[#E5DFC6] px-4 py-2 text-xs uppercase tracking-wide text-[#7A7151] disabled:opacity-50"
          >
            Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => ((prev + 1) as Step))}
              className="rounded-full bg-[#0a2225] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#E5DFC6]"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-full bg-[#0a2225] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#E5DFC6] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Finish Onboarding"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
