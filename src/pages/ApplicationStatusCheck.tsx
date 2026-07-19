import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";

const SERIF = "'Cormorant Garamond', Georgia, serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";

const STATUS_COPY: Record<string, { label: string; note: string }> = {
  pending_verification: {
    label: "Awaiting Identity Verification",
    note: "Complete your Stripe Identity verification to activate your account. Until then, your application remains on hold.",
  },
  verified: {
    label: "Account Active",
    note: "Your identity is confirmed and your account is active. Sign in with the email and password you used to apply.",
  },
  approved: {
    label: "Account Active",
    note: "Welcome to Goldsainte. Sign in with the email and password you used to apply to access your dashboard.",
  },
  rejected: {
    label: "Application Declined",
    note: "Your application has not been approved at this time. See the determination note below for context.",
  },
  draft: {
    label: "Application In Draft",
    note: "Your application has been started but not submitted. Return to the form to complete and submit.",
  },
};

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function shortRef(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export default function ApplicationStatusCheck() {
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<{
    id: string;
    type: 'agent' | 'brand';
    status: string;
    stripe_verification_status?: string;
    created_at: string;
    rejection_reason?: string;
    user_id?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    if (!user?.email) return;
    const targetEmail = user.email.toLowerCase().trim();
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const { data: agentApp } = await supabase
        .from('agent_applications')
        .select('id, email, first_name, last_name, status, stripe_verification_status, created_at, rejection_reason, user_id')
        .or(`email.eq.${targetEmail},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as any;

      const { data: brandApp } = await supabase
        .from('brand_applications')
        .select('id, brand_name, primary_contact_email, status, stripe_verification_status, created_at, rejection_reason, user_id')
        .or(`primary_contact_email.eq.${targetEmail},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as any;

      const application = agentApp || brandApp;

      if (application) {
        setStatus({
          ...application,
          type: agentApp ? 'agent' : 'brand',
        });
      } else {
        setError("We couldn't find an application linked to your account.");
      }
    } catch (err: any) {
      console.error(err);
      setError("An error occurred while checking your application status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    void checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const redirectEmail = searchParams.get('email');
  const signInHref = `/auth?redirect=${encodeURIComponent('/application/status')}${
    redirectEmail ? `&email=${encodeURIComponent(redirectEmail)}` : ''
  }`;

  // ────────────────────────────────────────────────
  // SIGNED-OUT STATE
  // ────────────────────────────────────────────────
  if (!authLoading && !user) {
    return (
      <div className="bg-[#f7f3ea] text-[#0a2225] flex-1 py-24 px-6 selection:bg-[#c9a84c]/30">
        <section className="w-full max-w-xl mx-auto text-center">
          <div className="flex justify-center mb-10">
            <div className="w-px h-16 bg-[#0a2225]" />
          </div>
          <span className="block uppercase tracking-[0.3em] text-[9px] font-bold mb-8 text-[#c9a84c]">
            Member Portal
          </span>
          <h1
            className="text-5xl md:text-6xl italic mb-10 tracking-tight leading-[0.95]"
            style={{ fontFamily: SERIF }}
          >
            Check Status
          </h1>
          <p className="text-base leading-relaxed mb-12 max-w-sm mx-auto text-[#0a2225]/70 font-light">
            Sign in with the email used during your application to view the current standing of your membership.
          </p>
          <Link
            to={signInHref}
            className="group relative inline-flex items-center gap-4 border border-[#0a2225] px-12 py-5 transition-all hover:bg-[#0a2225] hover:text-[#f7f3ea]"
          >
            <span className="relative z-10 text-xs uppercase tracking-[0.2em] font-semibold">
              Sign in to portal
            </span>
            <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </section>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // SIGNED-IN STATE
  // ────────────────────────────────────────────────
  const tierLabel = status
    ? status.type === "agent"
      ? "Travel Agent Application"
      : "Brand Partner Application"
    : "Membership Application";

  const statusKey = status?.status ?? "";
  const statusCopy = STATUS_COPY[statusKey] ?? {
    label: statusKey ? statusKey.replace(/_/g, " ") : "Pending",
    note: "Your application is in our queue. We will notify you via email as soon as the next step is available.",
  };
  const isApproved = statusKey === "verified" || statusKey === "approved";
  const isRejected = statusKey === "rejected";

  return (
    <div className="bg-[#f7f3ea] text-[#0a2225] flex-1 py-20 px-6 selection:bg-[#c9a84c]/30">
      <section className="w-full max-w-4xl mx-auto">
        {/* HEADER */}
        <header className="grid grid-cols-1 md:grid-cols-12 border-t border-b border-[#0a2225] py-8 mb-16 gap-6">
          <div className="md:col-span-8">
            <span className="block uppercase tracking-[0.2em] text-[10px] font-bold mb-4 text-[#c9a84c]">
              Dossier
            </span>
            <h2 className="text-4xl md:text-5xl tracking-tight" style={{ fontFamily: SERIF }}>
              {tierLabel}
            </h2>
          </div>
          <div className="md:col-span-4 md:text-right flex flex-col justify-end">
            <span className="block text-[9px] uppercase tracking-[0.2em] opacity-40 mb-1">
              Reference Signature
            </span>
            <span className="text-sm tracking-tighter" style={{ fontFamily: MONO }}>
              {status ? `GS-${shortRef(status.id)}` : "GS-————————"}
            </span>
          </div>
        </header>

        {/* LOADING / ERROR */}
        {(loading || authLoading) && !status && (
          <p className="text-sm text-[#0a2225]/60 italic mb-10" style={{ fontFamily: SERIF }}>
            Retrieving your dossier…
          </p>
        )}
        {error && !loading && (
          <div className="mb-12 border-l border-[#c9a84c] pl-6 py-2">
            <span className="block text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 mb-2">
              Notice
            </span>
            <p className="text-base text-[#0a2225]/80">{error}</p>
          </div>
        )}

        {/* BODY GRID */}
        {status && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              {/* Details Pane */}
              <div className="md:col-span-7 space-y-12">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 mb-4">
                      Application Tier
                    </label>
                    <p className="text-xl italic" style={{ fontFamily: SERIF }}>
                      {status.type === "agent" ? "Travel Agent" : "Brand Partner"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 mb-4">
                      Filing Date
                    </label>
                    <p className="text-xl italic" style={{ fontFamily: SERIF }}>
                      {formatLongDate(status.created_at)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#0a2225]/10 pt-8">
                  <label className="block text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 mb-6">
                    Compliance
                  </label>

                  <div className="flex items-start gap-6">
                    <div className="flex flex-col items-center pt-1">
                      <div
                        className={`w-3 h-3 rounded-full mb-2 ${
                          status.stripe_verification_status === "verified"
                            ? "bg-[#0a2225]"
                            : "border-2 border-[#c9a84c] animate-pulse"
                        }`}
                      />
                      <div className="w-px h-12 bg-[#0a2225]/10" />
                    </div>
                    <div className="pb-10">
                      <p className="text-base font-medium leading-none mb-2">Identity Verification</p>
                      <p className="text-sm opacity-60">
                        {status.stripe_verification_status === "verified"
                          ? "Cross-referenced & authenticated"
                          : status.stripe_verification_status === "pending"
                          ? "Awaiting Stripe Identity completion"
                          : "Not yet started"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6 -mt-2">
                    <div className="flex flex-col items-center pt-1">
                      <div
                        className={`w-3 h-3 rounded-full mb-2 ${
                          isApproved
                            ? "bg-[#0a2225]"
                            : isRejected
                            ? "border-2 border-[#0a2225]/40"
                            : "border-2 border-[#c9a84c] animate-pulse"
                        }`}
                      />
                    </div>
                    <div>
                      <p
                        className={`text-base font-medium leading-none mb-2 ${
                          isApproved ? "text-[#0a2225]" : isRejected ? "text-[#0a2225]/60" : "text-[#c9a84c]"
                        }`}
                      >
                        Account Provisioning
                      </p>
                      <p className="text-sm opacity-60">
                        {isApproved
                          ? "Active — sign in to access your dashboard"
                          : isRejected
                          ? "Suspended pending review outcome"
                          : "Awaiting verification completion"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Determination Card */}
              <div className="md:col-span-5">
                <div className="bg-[#0a2225] p-10 text-[#f7f3ea] relative overflow-hidden h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/15 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <label className="relative z-10 block text-[9px] uppercase tracking-[0.3em] font-bold opacity-50 mb-8">
                    Determination
                  </label>
                  <h3
                    className="relative z-10 text-3xl md:text-4xl italic mb-6 leading-tight"
                    style={{ fontFamily: SERIF }}
                  >
                    {statusCopy.label}
                  </h3>
                  <div className="relative z-10 w-12 h-px bg-[#c9a84c] mb-8" />
                  <p className="relative z-10 text-sm opacity-75 leading-relaxed font-light mb-12">
                    {statusCopy.note}
                  </p>
                  <div className="relative z-10">
                    <span className="block text-[9px] uppercase tracking-[0.2em] font-bold text-[#c9a84c] mb-2">
                      Signed in as
                    </span>
                    <p className="text-xs opacity-80" style={{ fontFamily: MONO }}>
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* REJECTION NOTE */}
            {isRejected && status.rejection_reason && (
              <div className="mt-16 pt-8 border-t border-[#0a2225]/10">
                <span className="block text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 mb-4">
                  Reviewer Note
                </span>
                <p className="text-lg italic text-[#0a2225]/80 leading-relaxed max-w-3xl" style={{ fontFamily: SERIF }}>
                  {status.rejection_reason}
                </p>
              </div>
            )}

            {/* PROCEDURAL FOOTER */}
            <div className="mt-24 pt-12 border-t border-[#0a2225]/10">
              <div className="flex flex-col md:flex-row gap-10 items-start">
                <div
                  className="w-12 h-12 flex-shrink-0 border border-[#0a2225] flex items-center justify-center italic text-2xl"
                  style={{ fontFamily: SERIF }}
                >
                  i
                </div>
                <div className="max-w-2xl">
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-4">
                    Procedural Note
                  </h4>
                  <p
                    className="text-xl md:text-2xl italic leading-relaxed text-[#0a2225]/80"
                    style={{ fontFamily: SERIF }}
                  >
                    All communications and payments must remain on platform. If you have a question about your
                    application, contact our concierge team rather than the reviewer directly.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex items-center gap-6">
              <button
                onClick={() => checkStatus()}
                disabled={loading}
                className="text-[10px] uppercase tracking-[0.2em] font-semibold border-b border-[#0a2225] pb-1 hover:text-[#c9a84c] hover:border-[#c9a84c] transition-colors disabled:opacity-40"
              >
                {loading ? "Refreshing…" : "Refresh status"}
              </button>
              {isApproved && (
                <Link
                  to="/auth"
                  className="text-[10px] uppercase tracking-[0.2em] font-semibold border-b border-[#0c4d47] text-[#0c4d47] pb-1 hover:text-[#0a2225] hover:border-[#0a2225] transition-colors"
                >
                  Sign in to dashboard
                </Link>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
