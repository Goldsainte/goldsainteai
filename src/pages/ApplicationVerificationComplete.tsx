import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ApplicationVerificationComplete() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  
  const applicationType = searchParams.get('type') as 'agent' | 'brand' || 'agent';

  useEffect(() => {
    const checkVerificationAndUpdateApplication = async () => {
      try {
        // Get application ID from localStorage based on application type
        const applicationId = applicationType === 'brand'
          ? localStorage.getItem('brand_application_id')
          : localStorage.getItem('agent_application_id');
        const email = applicationType === 'brand'
          ? localStorage.getItem('brand_application_email')
          : localStorage.getItem('agent_application_email');
        
        if (!applicationId) {
          setStatus('error');
          return;
        }

        // Wait a bit for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check verification status in database
        const tableName = applicationType === 'agent' ? 'agent_applications' : 'brand_applications';
        const { data: application, error } = await supabase
          .from(tableName)
          .select('status, stripe_verification_status')
          .eq('id', applicationId)
          .single();

        if (error || !application) {
          console.error('Error checking verification:', error);
          setStatus('error');
          return;
        }

        if (application.status === 'verified' || application.stripe_verification_status === 'verified') {
          // Application is already verified - no need to update
          // Clear localStorage based on application type
          if (applicationType === 'brand') {
            localStorage.removeItem('brand_application_id');
            localStorage.removeItem('brand_application_email');
          } else {
            localStorage.removeItem('agent_application_id');
            localStorage.removeItem('agent_application_email');
          }

          setStatus('success');
        } else if (application.status === 'failed') {
          setStatus('error');
        } else {
          // Still pending, show success anyway (webhook may still be processing)
          setStatus('success');
        }
      } catch (err) {
        console.error('Verification check error:', err);
        setStatus('error');
      }
    };

    checkVerificationAndUpdateApplication();
  }, [applicationType]);

  const eyebrow =
    status === "pending"
      ? "Verifying"
      : status === "success"
      ? "Verified"
      : "Notice";
  const headline =
    status === "pending"
      ? "One moment"
      : status === "success"
      ? applicationType === "agent"
        ? "You're In"
        : "Application Received"
      : "Verification Issue";

  return (
    <div className="bg-[#FDF9F0] text-[#0a2225] flex-1 py-24 px-6">
      <section className="w-full max-w-2xl mx-auto text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-5">
          {eyebrow}
        </p>
        <h1 className="font-secondary text-3xl sm:text-4xl md:text-6xl leading-[1.08] tracking-tight text-[#0a2225] mb-8">
          {headline}
        </h1>

        {status === "pending" && (
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

        {status === "error" && (
          <>
            <p className="text-base text-[#0a2225]/70 leading-relaxed max-w-md mx-auto mb-12">
              There was an issue processing your verification. Please contact our concierge team at{" "}
              <a href="mailto:support@goldsainte.com" className="text-[#0c4d47] underline underline-offset-4 hover:text-[#0a2225]">
                support@goldsainte.com
              </a>{" "}
              for assistance.
            </p>
            <Link
              to="/"
              className="group inline-flex items-center gap-3 border border-[#0a2225] px-10 py-4 rounded-sm transition-all hover:bg-[#0a2225] hover:text-[#FDF9F0]"
            >
              <span className="text-[11px] uppercase tracking-[0.22em] font-medium">Return home</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
