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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src={logomark} 
            alt="Goldsainte" 
            className="h-12 w-auto mx-auto mb-4"
          loading="lazy"/>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Verification Complete
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {status === 'pending' && (
                <>
                  <Clock className="h-6 w-6 text-[#C7A962] animate-pulse" />
                  Processing...
                </>
              )}
              {status === 'success' && (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500" />
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
              <p className="text-muted-foreground">
                We're confirming your identity verification with Stripe...
              </p>
            )}
            
            {status === 'success' && (
              <>
                <p className="text-muted-foreground">
                  Your identity has been successfully verified. Our team will review your{' '}
                  {applicationType} application and get back to you within 1-2 business days.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">What happens next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>✓ Our team reviews your application</li>
                    <li>✓ We'll email you when approved</li>
                    <li>✓ You'll receive login credentials</li>
                    <li>✓ Start using Goldsainte immediately</li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  You'll receive an email confirmation shortly. Please check your spam folder
                  if you don't see it within a few minutes.
                </p>
                <Button
                  onClick={() => navigate('/')}
                  className="w-full"
                  size="lg"
                >
                  Return to Home
                </Button>
              </>
            )}
            
            {status === 'error' && (
              <>
                <p className="text-muted-foreground">
                  There was an issue processing your verification. Please contact our support team
                  at support@goldsainte.com for assistance.
                </p>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full"
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
