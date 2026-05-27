import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EditorialLoader } from '@/components/EditorialLoader';
import { useToast } from '@/hooks/use-toast';
import { getEdgeFunctionUrl } from '@/lib/backendConfig';

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

          // Redirect to home page after successful sign-in
          navigate('/', { replace: true });
          return;
        }

        // If no token, check if we received POST data from Apple (old flow)
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const id_token = searchParams.get('id_token');

        if (code || state || id_token) {
          // Apple POSTed to React app - forward to edge function
          toast({
            title: "Processing...",
            description: "Completing Apple sign-in.",
          });

          const formData = new FormData();
          if (code) formData.append('code', code);
          if (state) formData.append('state', state);
          if (id_token) formData.append('id_token', id_token);
          const user = searchParams.get('user');
          if (user) formData.append('user', user);

          // Forward to edge function
          const response = await fetch(
            getEdgeFunctionUrl('apple-signin-callback'),
            {
              method: 'POST',
              body: formData,
              credentials: 'include',
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Edge function error:', errorText);
            throw new Error('Failed to complete Apple sign-in');
          }

          // Edge function should redirect us back with token
          // If we're still here, check response
          const responseUrl = response.url;
          if (responseUrl && responseUrl.includes('token=')) {
            window.location.href = responseUrl;
            return;
          }

          throw new Error('Failed to get redirect from edge function');
        }

        // No token, code, or state - something went wrong
        throw new Error('No authentication token received from Apple');

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
    <EditorialLoader
      eyebrow="Apple Sign In"
      title="One moment"
      subtitle={isProcessing ? 'Completing Apple sign-in.' : 'Redirecting you now.'}
    />
  );
};

export default AppleCallback;
