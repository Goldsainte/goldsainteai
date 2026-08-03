import { gsIntlLocale } from "@/lib/i18nFormat";
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
  return new Date(iso).toLocaleDateString(gsIntlLocale(), {
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
      <div className="flex-1 bg-[#FDF9F0] px-4 py-20 text-[#0a2225]">
        <section className="mx-auto w-full max-w-xl">
          <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">Application status</p>
          <h1 className="mt-3 font-secondary text-4xl leading-tight md:text-5xl">Where things stand.</h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#0a2225]/55">
            Sign in with the email you used to apply and we'll show you exactly where things stand.
          </p>
          <Link
            to={signInHref}
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-7 py-3 text-sm text-[#E5DFC6] transition-colors hover:bg-[#073331]"
          >
            Sign in
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
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
  // "verified" is identity-confirmed-awaiting-review, NOT an active account.
  // Treating it as approved is what rendered "Account Active" to an applicant
  // who had not been approved (and, tonight, to one who was rejected).
  const isApproved = statusKey === "approved";
  const isRejected = statusKey === "rejected";

  return (
    <div className="flex-1 bg-[#FDF9F0] px-4 py-14 md:py-20 text-[#0a2225]">
      {/* Editorial treatment matching the agent-dashboard baseline (30 Jul):
          kicker + large serif + gold roman numerals + hairlines. Truthful
          status copy from files 162/177 unchanged; no dossier vocabulary. */}
      <section className="mx-auto w-full max-w-4xl">
        <header className="mb-10">
          <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">Application status</p>
          <h2 className="mt-3 font-secondary text-4xl leading-tight md:text-5xl">{tierLabel}</h2>
          {status && (
            <p className="mt-4 text-[15px] text-[#0a2225]/55">
              Filed {formatLongDate(status.created_at)} · Reference GS-{shortRef(status.id)} · {user?.email}
            </p>
          )}
        </header>

        {(loading || authLoading) && !status && (
          <p className="mb-10 text-[15px] text-[#0a2225]/55">Checking your application…</p>
        )}
        {error && !loading && (
          <div className="mb-10 border-l-2 border-[#C7A962] pl-5">
            <p className="text-[15px] leading-relaxed text-[#0a2225]/80">{error}</p>
          </div>
        )}

        {status && (
          <>
            <div className="border-y border-[#0a2225]/10 py-9">
              <h3 className="font-secondary text-2xl md:text-3xl">{statusCopy.label}</h3>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#0a2225]/55">{statusCopy.note}</p>
            </div>

            <div className="border-b border-[#0a2225]/10 py-9">
              <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">Where things stand</p>
              <div className="mt-5 space-y-4 text-[15.5px] leading-relaxed text-[#0a2225]/80">
                <p className="flex gap-4">
                  <i className="w-5 shrink-0 font-secondary italic text-[#8D6B2F]">i.</i>
                  <span>
                    <span className="font-medium text-[#0a2225]">Identity verification — </span>
                    {status.stripe_verification_status === "verified"
                      ? "confirmed."
                      : status.stripe_verification_status === "pending"
                      ? "awaiting Stripe Identity completion."
                      : "not yet started."}
                  </span>
                </p>
                <p className="flex gap-4">
                  <i className="w-5 shrink-0 font-secondary italic text-[#8D6B2F]">ii.</i>
                  <span>
                    <span className={`font-medium ${isRejected ? "text-[#0a2225]/60" : "text-[#0a2225]"}`}>Account activation — </span>
                    {isApproved
                      ? "active. Sign in to access your dashboard."
                      : isRejected
                      ? "suspended pending review outcome."
                      : statusKey === "verified"
                      ? "pending approval by our review team."
                      : "awaiting verification completion."}
                  </span>
                </p>
              </div>
            </div>

            {isRejected && status.rejection_reason && (
              <div className="border-b border-[#0a2225]/10 py-9">
                <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">Note from our review team</p>
                <p className="mt-4 max-w-2xl font-secondary text-lg italic leading-relaxed text-[#0a2225]/80">
                  {status.rejection_reason}
                </p>
              </div>
            )}

            <p className="mt-9 max-w-2xl text-[13px] leading-relaxed text-[#0a2225]/45">
              All communications and payments must remain on platform. If you have a question about your
              application, contact our concierge team rather than the reviewer directly.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => checkStatus()}
                disabled={loading}
                className="rounded-full border border-[#0a2225]/20 px-6 py-2.5 text-sm transition-colors hover:border-[#C7A962] disabled:opacity-40"
              >
                {loading ? "Refreshing…" : "Refresh status"}
              </button>
              {isApproved && (
                <Link
                  to="/auth"
                  className="rounded-full bg-[#0c4d47] px-6 py-2.5 text-sm text-[#E5DFC6] transition-colors hover:bg-[#073331]"
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
