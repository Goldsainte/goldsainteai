import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const AppleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token from URL (redirected from edge function)
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || !type) {
          throw new Error('Missing authentication token');
        }

        // Use the token to establish the session
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any
        });

        if (verifyError) throw verifyError;

        // Clean up session storage
        sessionStorage.removeItem('apple_state');

        // Redirect to home
        navigate('/');
      } catch (err) {
        console.error('Apple callback error:', err);
        setError(err instanceof Error ? err.message : 'Failed to sign in with Apple');
        setTimeout(() => navigate('/auth'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-destructive mb-2">Authentication Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-4">Redirecting to login...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing Apple Sign-In...</p>
      </div>
    </div>
  );
};

export default AppleCallback;
