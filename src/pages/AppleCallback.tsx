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
        // Get parameters from URL or form post
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const idToken = searchParams.get('id_token');
        const userParam = searchParams.get('user');

        const storedState = sessionStorage.getItem('apple_state');

        // Verify state
        if (state !== storedState) {
          throw new Error('Invalid state parameter');
        }

        // Clean up session storage
        sessionStorage.removeItem('apple_state');

        // Call callback edge function
        const { data, error } = await supabase.functions.invoke('apple-signin-callback', {
          body: {
            code,
            state,
            id_token: idToken,
            user: userParam
          }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Authentication failed');

        // Use the magic link to establish the session
        if (data.magicLink) {
          const url = new URL(data.magicLink);
          const token = url.searchParams.get('token');
          const type = url.searchParams.get('type');

          if (token && type) {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: type as any
            });

            if (verifyError) throw verifyError;
          }
        }

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
