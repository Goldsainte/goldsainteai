import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type PageStatus = "loading" | "success" | "pending_review" | "failed" | "not_found";

// Map Stripe Identity last_error.code → user-facing copy.
function friendlyReason(code?: string | null, fallback?: string | null): string {
  if (!code && !fallback) return "Verification could not be completed.";
  switch (code) {
    case "document_expired":
      return "Your ID document is expired. Please upload a current one.";
    case "document_unverified_other":
    case "document_photo_unverified":
    case "document_photo_mismatch":
      return "Your ID photo was unclear or unreadable. Please retake it in good lighting and try again.";
    case "document_type_not_supported":
      return "That document type isn't supported. Try a passport, driver's license, or national ID card.";
    case "selfie_unverified_other":
    case "selfie_face_mismatch":
    case "selfie_document_missing_photo":
      return "Your selfie didn't match the photo on your ID. Please retake your selfie.";
    case "selfie_manipulated":
      return "We couldn't accept that selfie. Please retake it as a live photo, no filters.";
    case "id_number_mismatch":
    case "id_number_unverified_other":
    case "name_mismatch":
      return "The name or ID number didn't match what you entered on your application.";
    case "consent_declined":
      return "Verification was canceled before it finished. You can retry it now.";
    case "device_not_supported":
      return "Your device didn't support Stripe Identity. Please retry from a phone with a camera.";
    case "under_supported_age":
      return "You must be 18 or older to be verified.";
    default:
      return fallback || "Verification could not be completed.";
  }
}

export default function ApplicationVerificationComplete() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PageStatus>("loading");
  const [reason, setReason] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [resolvedAppId, setResolvedAppId] = useState<string | null>(null);
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const pollCount = useRef(0);

  const applicationType = (searchParams.get("type") as "agent" | "brand") || "agent";
  const urlAppId = searchParams.get("application_id");
  const urlSessionId = searchParams.get("vs");

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const check = async () => {
      try {
        // Identify the application from URL first, then localStorage fallback.
        const lsAppId =
          applicationType === "brand"
            ? localStorage.getItem("brand_application_id")
            : localStorage.getItem("agent_application_id");
        const applicationId = urlAppId || lsAppId;
        const tableName = applicationType === "agent" ? "agent_applications" : "brand_applications";

        let row: any = null;
        let lookupError: any = null;

        if (applicationId) {
          const res = await supabase
            .from(tableName)
            .select(
              "id, email, first_name, last_name, status, stripe_verification_status, stripe_verification_session_id, stripe_verified_at, rejection_reason, stripe_verification_report"
            )
            .eq("id", applicationId)
            .maybeSingle();
          row = res.data;
          lookupError = res.error;
        } else if (urlSessionId) {
          // Fallback: look up by Stripe verification session id from the return URL.
          const res = await supabase
            .from(tableName)
            .select(
              "id, email, first_name, last_name, status, stripe_verification_status, stripe_verification_session_id, stripe_verified_at, rejection_reason, stripe_verification_report"
            )
            .eq("stripe_verification_session_id", urlSessionId)
            .maybeSingle();
          row = res.data;
          lookupError = res.error;
        }

        if (cancelled) return;

        if (!applicationId && !urlSessionId) {
          setStatus("not_found");
          return;
        }
        if (lookupError) {
          console.error("verification lookup error", lookupError);
          setStatus("not_found");
          return;
        }
        if (!row) {
          setStatus("not_found");
          return;
        }

        setResolvedAppId(row.id);
        setResolvedEmail(row.email ?? null);
        setFirstName(row.first_name ?? null);
        setLastName(row.last_name ?? null);

        const verified =
          row.status === "verified" || row.stripe_verification_status === "verified";
        const failedStatuses = new Set(["failed", "rejected"]);
        const failed =
          failedStatuses.has(row.status) ||
          (row.stripe_verification_status &&
            ["canceled", "requires_input"].includes(row.stripe_verification_status) &&
            row.rejection_reason);

        if (verified) {
          if (applicationType === "brand") {
            localStorage.removeItem("brand_application_id");
            localStorage.removeItem("brand_application_email");
          } else {
            localStorage.removeItem("agent_application_id");
            localStorage.removeItem("agent_application_email");
          }
          setStatus("success");
          return;
        }

        if (failed) {
          const code = (row.stripe_verification_report as any)?.last_error?.code as
            | string
            | undefined;
          setReason(friendlyReason(code, row.rejection_reason));
          setStatus("failed");
          return;
        }

        // Session is still processing — poll for up to ~30s before settling on pending_review.
        if (row.stripe_verification_session_id && pollCount.current < 6) {
          pollCount.current += 1;
          pollTimer = setTimeout(check, 5000);
          return;
        }

        setStatus("pending_review");
      } catch (err) {
        console.error("verification check error", err);
        if (!cancelled) setStatus("not_found");
      }
    };

    check();
    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [applicationType, urlAppId, urlSessionId]);

  const handleRetry = async () => {
    if (!resolvedEmail) return;
    setRetrying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-identity-verification", {
        body: {
          email: resolvedEmail,
          applicationType,
          metadata: {
            applicationId: resolvedAppId,
            firstName: firstName || "",
            lastName: lastName || "",
          },
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No verification URL returned");
    } catch (err) {
      console.error("retry failed", err);
      setRetrying(false);
    }
  };

  const eyebrow =
    status === "loading"
      ? "Verifying"
      : status === "success"
      ? "Verified"
      : status === "pending_review"
      ? "In Review"
      : status === "failed"
      ? "Action Needed"
      : "Notice";
  const headline =
    status === "loading"
      ? "One moment"
      : status === "success"
      ? applicationType === "agent"
        ? "You're In"
        : "Application Received"
      : status === "pending_review"
      ? "Still Confirming"
      : status === "failed"
      ? "Verification Couldn't Be Completed"
      : "We Couldn't Locate Your Application";

  return (
    <div className="bg-[#FDF9F0] text-[#0a2225] flex-1 py-24 px-6">
      <section className="w-full max-w-2xl mx-auto text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-5">{eyebrow}</p>
        <h1 className="font-secondary text-3xl sm:text-4xl md:text-6xl leading-[1.08] tracking-tight text-[#0a2225] mb-8">
          {headline}
        </h1>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-5 w-5 animate-spin text-[#0c4d47]" strokeWidth={1.5} />
            <p className="text-base text-[#0a2225]/70 leading-relaxed max-w-md">
              We're confirming your identity with Stripe. This usually takes a few seconds.
            </p>
          </div>
        )}

        {status === "success" && applicationType === "agent" && (
          <>
            <p className="text-base text-[#0a2225]/70 leading-relaxed max-w-md mx-auto mb-12">
              Your identity is verified and your Goldsainte advisor account is live. Three short steps remain before you can take your first booking.
            </p>
            <ol className="text-left max-w-sm mx-auto space-y-5 mb-14 border-l border-[#E5DFC6] pl-6">
              <li>
                <span className="block text-[10px] uppercase tracking-[0.28em] text-[#C7A962] mb-1.5">01 — Dashboard</span>
                <span className="text-base text-[#0a2225]/80">Open your advisor dashboard</span>
              </li>
              <li>
                <span className="block text-[10px] uppercase tracking-[0.28em] text-[#C7A962] mb-1.5">02 — Payouts</span>
                <span className="text-base text-[#0a2225]/80">Connect Stripe to enable payouts</span>
              </li>
              <li>
                <span className="block text-[10px] uppercase tracking-[0.28em] text-[#C7A962] mb-1.5">03 — Publish</span>
                <span className="text-base text-[#0a2225]/80">Publish your first trip in Trip Builder</span>
              </li>
            </ol>
            <button
              onClick={() => navigate("/agent?tab=earnings")}
              className="group inline-flex items-center gap-3 bg-[#0c4d47] text-[#FDF9F0] px-10 py-4 rounded-sm transition-all hover:bg-[#0a2225]"
            >
              <span className="text-[11px] uppercase tracking-[0.22em] font-medium">Continue to dashboard</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </button>
          </>
        )}

        {status === "success" && applicationType !== "agent" && (
          <>
            <p className="text-base text-[#0a2225]/70 leading-relaxed max-w-md mx-auto mb-12">
              Your identity has been verified. Our team will review your brand application and return with a decision within one to two business days.
            </p>
            <Link
              to="/application/status"
              className="group inline-flex items-center gap-3 bg-[#0c4d47] text-[#FDF9F0] px-10 py-4 rounded-sm transition-all hover:bg-[#0a2225]"
            >
              <span className="text-[11px] uppercase tracking-[0.22em] font-medium">View application status</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          </>
        )}

        {status === "pending_review" && (
          <>
            <p className="text-base text-[#0a2225]/70 leading-relaxed max-w-md mx-auto mb-12">
              Stripe is still confirming your identity. This sometimes takes a few minutes. You can safely close this tab — we'll email you the moment it's done, or check back from your application status page.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="group inline-flex items-center gap-3 bg-[#0c4d47] text-[#FDF9F0] px-10 py-4 rounded-sm transition-all hover:bg-[#0a2225]"
              >
                <span className="text-[11px] uppercase tracking-[0.22em] font-medium">Refresh status</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
              </button>
              <Link
                to="/application/status"
                className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#0c4d47] underline underline-offset-4 hover:text-[#0a2225]"
              >
                View application status
              </Link>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <p className="text-base text-[#0a2225]/80 leading-relaxed max-w-md mx-auto mb-4">
              {reason || "Verification could not be completed."}
            </p>
            <p className="text-sm text-[#0a2225]/60 leading-relaxed max-w-md mx-auto mb-12">
              You can retry verification now. Have your government ID and a well-lit space ready.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={handleRetry}
                disabled={retrying || !resolvedEmail}
                className="group inline-flex items-center gap-3 bg-[#0c4d47] text-[#FDF9F0] px-10 py-4 rounded-sm transition-all hover:bg-[#0a2225] disabled:opacity-60"
              >
                {retrying ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                ) : (
                  <>
                    <span className="text-[11px] uppercase tracking-[0.22em] font-medium">Retry verification</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
                  </>
                )}
              </button>
              <Link
                to="/application/status"
                className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#0c4d47] underline underline-offset-4 hover:text-[#0a2225]"
              >
                View application status
              </Link>
            </div>
            <p className="text-xs text-[#0a2225]/50">
              Still stuck? Email{" "}
              <a href="mailto:support@goldsainte.com" className="text-[#0c4d47] underline underline-offset-4 hover:text-[#0a2225]">
                support@goldsainte.com
              </a>
              .
            </p>
          </>
        )}

        {status === "not_found" && (
          <>
            <p className="text-base text-[#0a2225]/70 leading-relaxed max-w-md mx-auto mb-12">
              We couldn't match this verification link to an application on this account. If you completed Stripe verification, check your email for the latest status update, or look it up by email below.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/application/status"
                className="group inline-flex items-center gap-3 bg-[#0c4d47] text-[#FDF9F0] px-10 py-4 rounded-sm transition-all hover:bg-[#0a2225]"
              >
                <span className="text-[11px] uppercase tracking-[0.22em] font-medium">Look up my application</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
              </Link>
              <Link
                to="/"
                className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#0c4d47] underline underline-offset-4 hover:text-[#0a2225]"
              >
                Return home
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
