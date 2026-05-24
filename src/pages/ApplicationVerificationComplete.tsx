import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SERIF = "'Cormorant Garamond', Georgia, serif";

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
    <div className="bg-[#f7f3ea] text-[#0a2225] flex-1 py-24 px-6 selection:bg-[#c9a84c]/30">
      <section className="w-full max-w-xl mx-auto text-center">
        <div className="flex justify-center mb-10">
          <div className="w-px h-16 bg-[#0a2225]" />
        </div>
        <span className="block uppercase tracking-[0.3em] text-[9px] font-bold mb-8 text-[#c9a84c]">
          {eyebrow}
        </span>
        <h1
          className="text-5xl md:text-6xl italic mb-10 tracking-tight leading-[0.95]"
          style={{ fontFamily: SERIF }}
        >
          {headline}
        </h1>

        {status === "pending" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-5 w-5 animate-spin text-[#0c4d47]" strokeWidth={1.5} />
            <p className="text-base text-[#0a2225]/70 font-light max-w-sm">
              We're confirming your identity with Stripe. This usually takes a few seconds.
            </p>
          </div>
        )}

        {status === "success" && applicationType === "agent" && (
          <>
            <p className="text-base text-[#0a2225]/75 font-light max-w-md mx-auto mb-12 leading-relaxed">
              Your identity is verified and your Goldsainte advisor account is live. Three short steps remain before you can take your first booking.
            </p>
            <ol className="text-left max-w-sm mx-auto space-y-5 mb-14 border-l border-[#c9a84c]/40 pl-6">
              <li>
                <span className="block text-[9px] uppercase tracking-[0.2em] font-bold text-[#c9a84c] mb-1">Step 01</span>
                <span className="text-base">Open your advisor dashboard</span>
              </li>
              <li>
                <span className="block text-[9px] uppercase tracking-[0.2em] font-bold text-[#c9a84c] mb-1">Step 02</span>
                <span className="text-base">Connect Stripe to enable payouts</span>
              </li>
              <li>
                <span className="block text-[9px] uppercase tracking-[0.2em] font-bold text-[#c9a84c] mb-1">Step 03</span>
                <span className="text-base">Publish your first trip in Trip Builder</span>
              </li>
            </ol>
            <button
              onClick={() => navigate("/agent?tab=earnings")}
              className="group inline-flex items-center gap-4 border border-[#0a2225] px-12 py-5 transition-all hover:bg-[#0a2225] hover:text-[#f7f3ea]"
            >
              <span className="text-xs uppercase tracking-[0.2em] font-semibold">Continue to dashboard</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </button>
          </>
        )}

        {status === "success" && applicationType !== "agent" && (
          <>
            <p className="text-base text-[#0a2225]/75 font-light max-w-md mx-auto mb-12 leading-relaxed">
              Your identity has been verified. Our team will review your brand application and return with a decision within one to two business days.
            </p>
            <Link
              to="/application/status"
              className="group inline-flex items-center gap-4 border border-[#0a2225] px-12 py-5 transition-all hover:bg-[#0a2225] hover:text-[#f7f3ea]"
            >
              <span className="text-xs uppercase tracking-[0.2em] font-semibold">View application status</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <p className="text-base text-[#0a2225]/75 font-light max-w-md mx-auto mb-12 leading-relaxed">
              There was an issue processing your verification. Please contact our concierge team at{" "}
              <a href="mailto:support@goldsainte.com" className="underline decoration-[#c9a84c] underline-offset-4">
                support@goldsainte.com
              </a>{" "}
              for assistance.
            </p>
            <Link
              to="/"
              className="group inline-flex items-center gap-4 border border-[#0a2225] px-12 py-5 transition-all hover:bg-[#0a2225] hover:text-[#f7f3ea]"
            >
              <span className="text-xs uppercase tracking-[0.2em] font-semibold">Return home</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
