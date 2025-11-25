import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Shield, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Step = 1 | 2;
type AccountType = "traveler" | "creator" | "agent" | "admin" | null;

export default function AgentApplyPage() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [kycLoading, setKycLoading] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  const [agencyName, setAgencyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseAuthority, setLicenseAuthority] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTikTok] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        sessionStorage.setItem('returnTo', '/apply/agent');
        navigate("/auth?returnTo=/apply/agent");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("account_type, agent_verification_status")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error loading profile", profileError);
      }
      if (cancelled) return;

      setAccountType((profile?.account_type || null) as AccountType);
      if (profile?.agent_verification_status) {
        setExistingStatus(profile.agent_verification_status);
      }
    }

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function toggleSpecialty(label: string) {
    setSpecialties((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setKycError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in.");

      const { error: upsertError } = await supabase
        .from("agent_applications")
        .insert(
          {
            first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Unknown',
            last_name: user.user_metadata?.last_name || '',
            email: user.email || '',
            phone: '+10000000000', // Temporary placeholder
            agency_name: agencyName || 'Unknown Agency',
            business_type: 'independent',
            business_address: 'Not provided',
            license_number: licenseNumber || null,
            accreditations: licenseAuthority || null,
            website: website || null,
            years_experience: yearsExperience ? Number(yearsExperience) : 0,
            specialties: specialties,
            status: "pending_verification",
          }
        );

      if (upsertError) throw upsertError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          account_type: "agent",
          agent_verification_status: "pending",
          agent_agency_name: agencyName || null,
          agent_license_number: licenseNumber || null,
          agent_license_authority: licenseAuthority || null,
          agent_years_experience: yearsExperience ? Number(yearsExperience) : null,
          agent_specialties: specialties,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setSuccess(
        "Thank you. Your application is now pending review. We'll email you once we've completed verification."
      );
      setExistingStatus("pending");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "We couldn't submit your application right now.");
    } finally {
      setLoading(false);
    }
  }

  async function startKycVerification() {
    setKycError(null);
    setKycLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-start-verification", {
        body: {},
      });

      if (error) {
        console.error("Error invoking agent-start-verification", error);
        setKycError("We couldn't start verification. Please try again shortly.");
        return;
      }

      const verificationUrl = (data as any)?.verificationUrl;
      if (!verificationUrl) {
        setKycError("Verification could not be initialized yet.");
        return;
      }

      window.location.href = verificationUrl;
    } catch (err: any) {
      console.error("Unexpected error starting KYC", err);
      setKycError("Something went wrong starting verification.");
    } finally {
      setKycLoading(false);
    }
  }

  const specialtiesOptions = [
    "Honeymoons & romance",
    "Families & multi-gen",
    "Adventure & outdoors",
    "Food & wine",
    "Art & culture",
    "Ultra-luxury stays",
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <ArrowLeft className="h-3 w-3" />
            Back to home
          </Link>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Goldsainte for travel agents
          </p>
          <h1 className="font-display text-[22px] md:text-[24px] leading-tight">
            Apply as a certified travel agent
          </h1>
          <p className="text-[11px] md:text-[12px] text-muted-foreground">
            We verify every agent before they can access traveler briefs or send proposals. This keeps our marketplace
            high-trust and lets creators feel confident partnering with you.
          </p>

          {existingStatus === "pending" && (
            <p className="text-[10px] text-muted-foreground">
              Your application is currently <strong>pending</strong>. You can update details below if something has
              changed.
            </p>
          )}
          {existingStatus === "verified" && (
            <p className="text-[10px] text-primary">
              You are already a <strong>verified agent</strong> on Goldsainte.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 md:pb-20">
        <form onSubmit={handleSubmit} className="rounded-3xl bg-card border border-border p-4 md:p-5 space-y-5 text-[11px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary">
              <Shield className="h-3 w-3 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Step {step} of 2</p>
              <p className="text-[12px] font-semibold">Tell us about your practice</p>
            </div>
          </div>

          {error && <p className="text-[10px] text-destructive">{error}</p>}
          {success && <p className="text-[10px] text-primary">{success}</p>}
          {kycError && <p className="text-[10px] text-destructive">{kycError}</p>}

          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] mb-1">Agency or host name *</label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  required
                  className="w-full rounded-full border border-border bg-background px-3 py-2 text-[11px] focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-[10px] mb-1">License or accreditation number *</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    required
                    className="w-full rounded-full border border-border bg-background px-3 py-2 text-[11px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] mb-1">Issuing authority (IATA, CLIA, etc.) *</label>
                  <input
                    type="text"
                    value={licenseAuthority}
                    onChange={(e) => setLicenseAuthority(e.target.value)}
                    required
                    className="w-full rounded-full border border-border bg-background px-3 py-2 text-[11px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-[10px] mb-1">Website (optional)</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://"
                    className="w-full rounded-full border border-border bg-background px-3 py-2 text-[11px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] mb-1">Years of experience</label>
                  <input
                    type="number"
                    min={0}
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full rounded-full border border-border bg-background px-3 py-2 text-[11px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-[10px] font-semibold hover:bg-primary/90"
                >
                  Next
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] mb-1">Social handles (optional)</label>
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@youragency on Instagram"
                    className="w-full rounded-full border border-border bg-background px-3 py-2 text-[11px] focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    value={tiktok}
                    onChange={(e) => setTikTok(e.target.value)}
                    placeholder="@youragency on TikTok"
                    className="w-full rounded-full border border-border bg-background px-3 py-2 text-[11px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] mb-1">What do you specialise in?</label>
                <div className="flex flex-wrap gap-1.5">
                  {specialtiesOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleSpecialty(opt)}
                      className={`rounded-full border px-3 py-1 text-[10px] ${
                        specialties.includes(opt)
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-border text-foreground"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] mb-1">Anything else we should know?</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-[11px] focus:outline-none focus:border-primary"
                  placeholder="Destinations you focus on, key partners, typical client profile…"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-[10px] font-semibold hover:bg-primary/90 disabled:opacity-60"
                >
                  {loading ? "Submitting…" : "Submit application"}
                  <Sparkles className="h-3 w-3" />
                </button>
              </div>

              {existingStatus === "pending" && (
                <div className="mt-3">
                  <p className="text-[10px] text-muted-foreground mb-1">
                    To finish becoming a Goldsainte agent, we'll ask you to verify your government ID and complete a
                    quick facial scan through our partner, Stripe Identity.
                  </p>
                  <button
                    type="button"
                    disabled={kycLoading}
                    onClick={startKycVerification}
                    className="inline-flex items-center gap-2 rounded-full bg-card text-foreground border border-border px-4 py-1.5 text-[10px] font-semibold hover:border-primary disabled:opacity-60"
                  >
                    {kycLoading ? "Starting verification…" : "Continue ID & facial verification"}
                    <Shield className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
