import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logomark from "@/assets/logomark-gold.png";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF9F0] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={logomark}
            alt="Goldsainte"
            className="h-12 w-auto mx-auto mb-4"
            loading="lazy"
          />
          <h1 className="font-secondary text-[26px] md:text-[31px] text-[#0a2225] mb-2">
            Verification Complete
          </h1>
        </div>

        <Card className="bg-white border border-[#E5DFC6] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-secondary text-[#0a2225]">
              {status === 'pending' && (
                <>
                  <Clock className="h-6 w-6 text-[#C7A962] animate-pulse" />
                  Processing...
                </>
              )}
              {status === 'success' && (
                <>
                  <CheckCircle className="h-6 w-6 text-[#0c4d47]" />
                  Identity Verified
                </>
              )}
              {status === 'error' && (
                <>
                  <AlertCircle className="h-6 w-6 text-red-500" />
                  Verification Issue
                </>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {status === 'pending' && (
              <p className="text-[#6B7280]">
                We're confirming your identity verification with Stripe...
              </p>
            )}
            
            {status === 'success' && (
              <>
                {applicationType === 'agent' ? (
                  <>
                    <p className="text-[#0a2225]">
                      Your identity is verified and your Goldsainte advisor account is
                      <strong> live</strong>.
                    </p>
                    <div className="bg-[#F5EFE1] border border-[#E5DFC6] p-4 rounded-xl">
                      <h3 className="font-secondary text-lg text-[#0a2225] mb-2">Next steps</h3>
                      <ul className="text-sm text-[#0a2225] space-y-2">
                        <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#C7A962]" />Open your advisor dashboard</li>
                        <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#C7A962]" />Connect Stripe in Earnings to enable payouts</li>
                        <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#C7A962]" />Publish your first trip in Trip Builder</li>
                      </ul>
                    </div>
                    <Button
                      onClick={() => navigate('/agent?tab=earnings')}
                      className="w-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full"
                      size="lg"
                    >
                      Continue to Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-[#6B7280]">
                      Your identity has been successfully verified. Our team will review your
                      {' '}brand application and get back to you within 1–2 business days.
                    </p>
                    <Button
                      onClick={() => navigate('/')}
                      className="w-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full"
                      size="lg"
                    >
                      Return to Home
                    </Button>
                  </>
                )}
              </>
            )}
            
            {status === 'error' && (
              <>
                <p className="text-[#6B7280]">
                  There was an issue processing your verification. Please contact our support team
                  at support@goldsainte.com for assistance.
                </p>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full border-[#E5DFC6] text-[#0a2225] hover:bg-[#E5DFC6]/20 rounded-full"
                >
                  Return to Home
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
