import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const InstagramCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Instagram connection...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorReason = searchParams.get('error_reason');
      const errorDescription = searchParams.get('error_description');

      // Handle errors from Instagram
      if (error) {
        setStatus('error');
        setMessage(errorDescription || 'Instagram authorization failed');
        toast.error('Failed to connect Instagram', {
          description: errorDescription || errorReason || 'Authorization was denied'
        });
        return;
      }

      // Handle missing code
      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        toast.error('Failed to connect Instagram', {
          description: 'No authorization code received from Instagram'
        });
        return;
      }

      // Handle missing user
      if (!user) {
        setStatus('error');
        setMessage('You must be logged in to connect Instagram');
        toast.error('Authentication required', {
          description: 'Please log in to connect your Instagram account'
        });
        return;
      }

      try {
        // Call the edge function to exchange code for tokens
        const { data, error: functionError } = await supabase.functions.invoke('instagram-oauth-callback', {
          body: { code }
        });

        if (functionError) throw functionError;

        if (data?.success) {
          setStatus('success');
          setMessage('Instagram connected successfully!');
          toast.success('Instagram connected!', {
            description: `Connected as @${data.username}`
          });

          // Update profile with Instagram username
          await supabase
            .from('profiles')
            .update({ 
              instagram_username: data.username,
              auto_share_instagram: false // Default to off, user can enable later
            })
            .eq('id', user.id);

          // Redirect after a short delay
          setTimeout(() => {
            navigate('/crossposting-settings');
          }, 2000);
        } else {
          throw new Error(data?.error || 'Failed to connect Instagram');
        }
      } catch (error: any) {
        console.error('Instagram callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to connect Instagram');
        toast.error('Failed to connect Instagram', {
          description: error.message || 'An unexpected error occurred'
        });
      }
    };

    handleCallback();
  }, [searchParams, user, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-bold">{message}</h2>
            <p className="text-muted-foreground">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">{message}</h2>
            <p className="text-muted-foreground">Redirecting to settings...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold">Connection Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <Button onClick={() => navigate('/crossposting-settings')}>
              Back to Settings
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default InstagramCallback;
