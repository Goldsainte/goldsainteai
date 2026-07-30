import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";


const STATUS_COPY: Record<string, { label: string; note: string }> = {
  pending_verification: {
    label: "Awaiting Identity Verification",
    note: "Complete your Stripe Identity verification to activate your account. Until then, your application remains on hold.",
  },
  // "verified" now means identity confirmed, application with the review team —
  // it no longer means the account is live (admin review gate, Jul 25).
  verified: {
    label: "Under Review",
    note: "Your identity is confirmed. Our team is reviewing your credentials and insurance, and we'll email you a decision — typically within one to two business days.",
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

      let application = agentApp || brandApp;
      let fallbackType: 'agent' | 'brand' | null = null;

      // RLS FALLBACK (Jul 26). The direct queries above run with the user's
      // session, and agent_applications RLS only exposes rows where
      // user_id = auth.uid(). Provisioning links the application to the
      // PROVISIONED account, which may not be the account the person is
      // signed in with — so this page told an approved applicant "We couldn't
      // find an application linked to your account." The edge function
      // verifies the caller's JWT server-side and looks up by their verified
      // email with the service role.
      if (!application) {
        for (const t of ['agent', 'brand'] as const) {
          try {
            const { data: fnData } = await supabase.functions.invoke('get-application-status', {
              body: { self: true, applicationType: t },
            });
            if ((fnData as any)?.found) {
              application = (fnData as any).application;
              fallbackType = t;
              break;
            }
          } catch (e) {
            console.error('self status fallback failed', e);
          }
        }
      }

      if (application) {
        setStatus({
          ...application,
          type: fallbackType ?? (agentApp ? 'agent' : 'brand'),
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
      <div className="flex-1 bg-[#FDF9F0] px-3 sm:px-4 py-16 text-[#0a2225]">
        <section className="mx-auto w-full max-w-xl">
          <div className="rounded-2xl border border-[#E5DFC6] bg-white p-8 text-center shadow-sm md:p-10">
            <h1 className="font-secondary text-2xl md:text-3xl text-[#0a2225]">Check Your Application Status</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#6B7280]">
              Sign in with the email you used to apply and we'll show you exactly where things stand.
            </p>
            <Link
              to={signInHref}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-6 py-2.5 text-sm text-[#E5DFC6] transition-colors hover:bg-[#073331]"
            >
              Sign in
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
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
  // "verified" is identity-confirmed-awaiting-review, NOT an active account.
  // Treating it as approved is what rendered "Account Active" to an applicant
  // who had not been approved (and, tonight, to one who was rejected).
  const isApproved = statusKey === "approved";
  const isRejected = statusKey === "rejected";

  return (
    <div className="flex-1 bg-[#FDF9F0] px-3 sm:px-4 py-10 md:py-16 text-[#0a2225]">
      <section className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-[#E5DFC6] bg-white p-6 md:p-10 shadow-sm">
          {/* HEADER — same accent-bar family as the application steps */}
          <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-[#C7A962]" />
                <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225]">{tierLabel}</h2>
              </div>
              <p className="ml-4 text-sm text-[#6B7280]">
                {status ? `Filed ${formatLongDate(status.created_at)}` : "Your application at a glance"}
              </p>
            </div>
            <p className="ml-4 text-xs text-[#6B7280] md:ml-0 md:text-right">
              Reference<br />
              <span className="font-medium text-[#0a2225]">{status ? `GS-${shortRef(status.id)}` : "—"}</span>
            </p>
          </header>

          {/* LOADING / ERROR */}
          {(loading || authLoading) && !status && (
            <p className="mb-8 text-sm text-[#6B7280]">Checking your application…</p>
          )}
          {error && !loading && (
            <div className="mb-8 flex items-start gap-3 rounded-xl border border-[#C7A962]/60 bg-[#FDF9F0] p-4">
              <p className="text-sm text-[#0a2225]/80">{error}</p>
            </div>
          )}

          {status && (
            <>
              {/* STATUS BANNER */}
              <div
                className={`mb-8 rounded-xl p-6 ${
                  isApproved
                    ? "bg-[#0c4d47] text-[#E5DFC6]"
                    : isRejected
                    ? "border border-red-200 bg-red-50 text-red-900"
                    : "border border-[#C7A962]/60 bg-[#FDF9F0] text-[#0a2225]"
                }`}
              >
                <h3 className="font-secondary text-xl md:text-2xl">{statusCopy.label}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${isApproved ? "text-[#E5DFC6]/85" : isRejected ? "text-red-800" : "text-[#0a2225]/70"}`}>
                  {statusCopy.note}
                </p>
                <p className={`mt-4 text-xs ${isApproved ? "text-[#E5DFC6]/60" : "text-[#6B7280]"}`}>
                  Signed in as {user?.email}
                </p>
              </div>

              {/* PROGRESS */}
              <div className="mb-8">
                <p className="mb-4 text-sm font-medium text-[#0a2225]">Where things stand</p>

                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className={`mb-2 h-3 w-3 rounded-full ${
                        status.stripe_verification_status === "verified"
                          ? "bg-[#0c4d47]"
                          : "animate-pulse border-2 border-[#C7A962]"
                      }`}
                    />
                    <div className="h-10 w-px bg-[#E5DFC6]" />
                  </div>
                  <div className="pb-8">
                    <p className="mb-1 text-sm font-medium text-[#0a2225]">Identity verification</p>
                    <p className="text-sm text-[#6B7280]">
                      {status.stripe_verification_status === "verified"
                        ? "Confirmed"
                        : status.stripe_verification_status === "pending"
                        ? "Awaiting Stripe Identity completion"
                        : "Not yet started"}
                    </p>
                  </div>
                </div>

                <div className="-mt-2 flex items-start gap-4">
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className={`mb-2 h-3 w-3 rounded-full ${
                        isApproved
                          ? "bg-[#0c4d47]"
                          : isRejected
                          ? "border-2 border-[#0a2225]/30"
                          : "animate-pulse border-2 border-[#C7A962]"
                      }`}
                    />
                  </div>
                  <div>
                    <p className={`mb-1 text-sm font-medium ${isRejected ? "text-[#0a2225]/60" : "text-[#0a2225]"}`}>
                      Account activation
                    </p>
                    <p className="text-sm text-[#6B7280]">
                      {isApproved
                        ? "Active — sign in to access your dashboard"
                        : isRejected
                        ? "Suspended pending review outcome"
                        : statusKey === "verified"
                        ? "Pending approval by our review team"
                        : "Awaiting verification completion"}
                    </p>
                  </div>
                </div>
              </div>

              {/* REJECTION NOTE */}
              {isRejected && status.rejection_reason && (
                <div className="mb-8 rounded-xl border border-[#E5DFC6] bg-[#FDF9F0]/60 p-5">
                  <p className="mb-2 text-sm font-medium text-[#0a2225]">Note from our review team</p>
                  <p className="text-sm leading-relaxed text-[#0a2225]/80">{status.rejection_reason}</p>
                </div>
              )}

              {/* FOOTNOTE + ACTIONS */}
              <p className="mb-6 text-xs leading-relaxed text-[#6B7280]">
                All communications and payments must remain on platform. If you have a question about your
                application, contact our concierge team rather than the reviewer directly.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => checkStatus()}
                  disabled={loading}
                  className="rounded-full border border-[#E5DFC6] px-5 py-2 text-sm text-[#0a2225] transition-colors hover:border-[#C7A962] disabled:opacity-40"
                >
                  {loading ? "Refreshing…" : "Refresh status"}
                </button>
                {isApproved && (
                  <Link
                    to="/auth"
                    className="rounded-full bg-[#0c4d47] px-5 py-2 text-sm text-[#E5DFC6] transition-colors hover:bg-[#073331]"
                  >
                    Sign in to dashboard
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
