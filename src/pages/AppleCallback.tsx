import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AppleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we're receiving auth token from our edge function
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (token && type) {
          // Direct token from edge function - verify and create session
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as any,
          });

          if (error) throw error;

          toast({
            title: "Welcome!",
            description: "Successfully signed in with Apple.",
          });

          // Check if user has AI agent profile
          const { data: profileData } = await supabase
            .from('ai_agent_profiles')
            .select('id')
            .eq('user_id', data.user?.id)
            .maybeSingle();

          if (profileData) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/create-agent-profile', { replace: true });
          }
          return;
        }

        // If no token, we might be receiving POST data from Apple
        // This shouldn't happen in the new flow, but handle it just in case
        toast({
          title: "Processing...",
          description: "Completing Apple sign-in.",
        });

        // Forward to edge function for processing
        const formData = new FormData();
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const id_token = searchParams.get('id_token');
        const user = searchParams.get('user');

        if (code) formData.append('code', code);
        if (state) formData.append('state', state);
        if (id_token) formData.append('id_token', id_token);
        if (user) formData.append('user', user);

        // Call edge function to complete OAuth
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apple-signin-callback`,
          {
            method: 'POST',
            body: formData,
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to complete Apple sign-in');
        }

        // Edge function will redirect us back with token
        // If we get here without redirect, something went wrong
        const result = await response.json();
        console.log('Callback result:', result);

      } catch (error: any) {
        console.error('Apple callback error:', error);
        toast({
          title: "Sign in failed",
          description: error.message || "Failed to complete Apple sign-in",
          variant: "destructive",
        });
        navigate('/auth', { replace: true });
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">
          {isProcessing ? 'Completing Apple sign-in...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
};

export default AppleCallback;
