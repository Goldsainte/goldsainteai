import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { saveCreatorOnboarding } from "@/services/profileService";

type StepId = 1 | 2 | 3 | 4;

const NICHE_OPTIONS = [
  "European city breaks",
  "Beach escapes",
  "Design hotels",
  "Villas & homes",
  "Adventure",
  "Wellness",
  "Food & wine",
  "Nightlife",
  "Family-friendly",
];

const BUDGET_OPTIONS = ["Affordable-chic", "Classic luxury", "Ultra-luxury"];

export default function CreatorOnboardingPage() {
  const [step, setStep] = useState<StepId>(1);
  const navigate = useNavigate();

  // shared state
  const [displayName, setDisplayName] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [homeBase, setHomeBase] = useState("");
  const [niches, setNiches] = useState<string[]>([]);
  const [budgetLevels, setBudgetLevels] = useState<string[]>([]);
  const [pov, setPov] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goNext = () => setStep((prev) => (prev < 4 ? ((prev + 1) as StepId) : prev));
  const goPrev = () => setStep((prev) => (prev > 1 ? ((prev - 1) as StepId) : prev));

  const handleFinish = async () => {
    setError(null);

    // simple validation
    if (!displayName.trim() || !tiktokHandle.trim()) {
      setError("Please add at least your display name and TikTok handle.");
      setStep(1);
      return;
    }
    if (!policyAccepted) {
      setError("Please agree to keep conversations and payments on Goldsainte.");
      setStep(3);
      return;
    }

    setSaving(true);
    try {
      await saveCreatorOnboarding({
        display_name: displayName.trim(),
        tiktok_handle: tiktokHandle.trim(),
        home_base: homeBase.trim() || undefined,
        creator_niches: niches,
        creator_budget_levels: budgetLevels,
        creator_pov: pov.trim() || undefined,
      });

      navigate("/tiktok-lab");
    } catch (err: any) {
      setError(err.message || "We couldn't finish your onboarding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-[32px] bg-card/90 border border-border p-6 md:p-8 space-y-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background/60">
              <Sparkles className="h-3 w-3" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Creator onboarding
              </p>
              <p className="text-[12px] font-semibold">
                {step === 1 && "Welcome, creator"}
                {step === 2 && "Your travel niche & style"}
                {step === 3 && "How you earn on Goldsainte"}
                {step === 4 && "Your first storyboard"}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Step {step} of 4
          </p>
        </header>

        {error && (
          <p className="text-[10px] text-red-600 border border-red-200 bg-red-50 rounded-2xl px-3 py-1">
            {error}
          </p>
        )}

        <div className="border-t border-border pt-4">
          {step === 1 && (
            <Step1Basics
              displayName={displayName}
              setDisplayName={setDisplayName}
              tiktokHandle={tiktokHandle}
              setTiktokHandle={setTiktokHandle}
              homeBase={homeBase}
              setHomeBase={setHomeBase}
            />
          )}
          {step === 2 && (
            <Step2Niche
              niches={niches}
              setNiches={setNiches}
              budgetLevels={budgetLevels}
              setBudgetLevels={setBudgetLevels}
              pov={pov}
              setPov={setPov}
            />
          )}
          {step === 3 && (
            <Step3Earnings
              policyAccepted={policyAccepted}
              setPolicyAccepted={setPolicyAccepted}
            />
          )}
          {step === 4 && <Step4Storyboard />}
        </div>

        <footer className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 1}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground disabled:opacity-40"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground text-background px-4 py-2 text-[11px] font-semibold hover:bg-foreground/90"
            >
              Continue
              <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground text-background px-4 py-2 text-[11px] font-semibold hover:bg-foreground/90 disabled:opacity-50"
            >
              {saving ? "Finishing…" : "Go to Goldsainte Creator Lab"}
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </footer>
      </div>
    </main>
  );
}

// ---- Step components re-used but now controlled ----

type Step1Props = {
  displayName: string;
  setDisplayName: (v: string) => void;
  tiktokHandle: string;
  setTiktokHandle: (v: string) => void;
  homeBase: string;
  setHomeBase: (v: string) => void;
};

function Step1Basics({
  displayName,
  setDisplayName,
  tiktokHandle,
  setTiktokHandle,
  homeBase,
  setHomeBase,
}: Step1Props) {
  return (
    <div className="space-y-3 text-[11px]">
      <p className="text-muted-foreground">
        Let's set the stage for your travel universe. We'll use this to
        personalize requests and show agents who they're partnering with.
      </p>
      <div className="space-y-2">
        <label className="block space-y-1">
          <span className="font-semibold">Display name</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-2xl border border-border bg-muted px-3 py-2 text-[11px] outline-none"
            placeholder="e.g. JetLag & Champagne"
          />
        </label>
        <label className="block space-y-1">
          <span className="font-semibold">TikTok handle</span>
          <div className="flex items-center rounded-2xl border border-border bg-muted px-3 py-2">
            <span className="text-muted-foreground text-[11px] mr-1">@</span>
            <input
              type="text"
              value={tiktokHandle}
              onChange={(e) => setTiktokHandle(e.target.value)}
              className="flex-1 bg-transparent text-[11px] outline-none"
              placeholder="yourhandle"
            />
          </div>
        </label>
        <label className="block space-y-1">
          <span>Home base (optional)</span>
          <input
            type="text"
            value={homeBase}
            onChange={(e) => setHomeBase(e.target.value)}
            className="w-full rounded-2xl border border-border bg-muted px-3 py-2 text-[11px] outline-none"
            placeholder="e.g. New York, London, Dubai"
          />
        </label>
      </div>
    </div>
  );
}

type Step2Props = {
  niches: string[];
  setNiches: (v: string[]) => void;
  budgetLevels: string[];
  setBudgetLevels: (v: string[]) => void;
  pov: string;
  setPov: (v: string) => void;
};

function Step2Niche({
  niches,
  setNiches,
  budgetLevels,
  setBudgetLevels,
  pov,
  setPov,
}: Step2Props) {
  const toggleNiche = (value: string) =>
    setNiches(niches.includes(value) ? niches.filter((v) => v !== value) : [...niches, value]);
  const toggleBudget = (value: string) =>
    setBudgetLevels(
      budgetLevels.includes(value)
        ? budgetLevels.filter((v) => v !== value)
        : [...budgetLevels, value]
    );
  return (
    <div className="space-y-3 text-[11px]">
      <p className="text-muted-foreground">
        Tell us what kind of trips feel the most "you". This helps Goldsainte
        match you with the right travelers and agents.
      </p>
      <div className="space-y-2">
        <fieldset className="space-y-2">
          <legend className="font-semibold">Travel niches</legend>
          <div className="grid grid-cols-2 gap-2">
            {NICHE_OPTIONS.map((tag) => (
              <label
                key={tag}
                className="flex items-center gap-2 text-[10px]"
              >
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={niches.includes(tag)}
                  onChange={() => toggleNiche(tag)}
                />
                <span>{tag}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2 pt-2">
          <legend className="font-semibold">Typical budget level</legend>
          <div className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map((tag) => (
              <label
                key={tag}
                className="flex items-center gap-2 text-[10px]"
              >
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={budgetLevels.includes(tag)}
                  onChange={() => toggleBudget(tag)}
                />
                <span>{tag}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block space-y-1 pt-2">
          <span>Your travel point of view</span>
          <textarea
            rows={3}
            value={pov}
            onChange={(e) => setPov(e.target.value)}
            className="w-full rounded-2xl border border-border bg-muted px-3 py-2 text-[11px] outline-none"
            placeholder="Describe your travel POV in a few lines. What makes your recommendations unique?"
          />
        </label>
      </div>
    </div>
  );
}

type Step3Props = {
  policyAccepted: boolean;
  setPolicyAccepted: (v: boolean) => void;
};

function Step3Earnings({ policyAccepted, setPolicyAccepted }: Step3Props) {
  return (
    <div className="space-y-3 text-[11px]">
      <p className="text-muted-foreground">
        When a traveler books a trip inspired by your storyboard, you earn a
        share of the booking value. Travel agents handle pricing and logistics;
        Goldsainte manages payments and payouts.
      </p>
      <ul className="list-disc list-inside text-muted-foreground space-y-1">
        <li>Secure payments and escrow for travelers.</li>
        <li>Automatic payouts for you and the travel agent.</li>
        <li>No invoices, no chasing DMs, no off-platform payment links.</li>
      </ul>

      <label className="flex items-start gap-2 pt-2 text-[10px]">
        <input
          type="checkbox"
          className="mt-0.5 h-3 w-3"
          checked={policyAccepted}
          onChange={(e) => setPolicyAccepted(e.target.checked)}
        />
        <span>
          I agree to keep trip conversations and payments on Goldsainte, not in
          external DMs or direct payment links.
        </span>
      </label>
    </div>
  );
}

function Step4Storyboard() {
  return (
    <div className="space-y-3 text-[11px]">
      <p className="text-muted-foreground">
        Your trips are ready to become storyboards — the bookable version of
        your content.
      </p>
      <p className="text-muted-foreground">
        Start with one great trip you've filmed recently. We'll help you
        outline the destination, key moments and starting budget so agents can
        plug in rates.
      </p>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-foreground text-background px-4 py-2 text-[11px] font-semibold hover:bg-foreground/90"
        >
          Create a storyboard manually
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-transparent text-foreground px-4 py-2 text-[11px] font-semibold hover:bg-muted"
        >
          (Coming soon) Paste a TikTok link
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        After onboarding, you'll land in Goldsainte Creator Lab where you can manage
        storyboards, see requests and track earnings.
      </p>
    </div>
  );
}
