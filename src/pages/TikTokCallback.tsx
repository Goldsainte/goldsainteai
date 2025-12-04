import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TikTokCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const returnTo = searchParams.get('return_to') || 'tiktok-lab';
    const followers = searchParams.get('followers');

    const getRedirectPath = () => {
      if (returnTo === 'onboarding') {
        // Redirect back to creator onboarding with verification params
        const params = new URLSearchParams();
        if (success === 'true') {
          params.set('tiktok_verified', 'true');
          if (followers) {
            params.set('tiktok_followers', followers);
          }
        }
        return `/onboarding/creator?${params.toString()}`;
      }
      return `/${returnTo}`;
    };

    if (success === 'true') {
      setStatus('success');
      const followerText = followers ? ` (${parseInt(followers).toLocaleString()} followers)` : '';
      toast({
        title: 'TikTok Connected!',
        description: `Your TikTok account has been successfully verified${followerText}.`,
      });
      setTimeout(() => {
        navigate(getRedirectPath());
      }, 2000);
    } else if (error) {
      setStatus('error');
      let errorMessage = 'Failed to connect TikTok account.';
      
      switch (error) {
        case 'invalid_state':
          errorMessage = 'Security validation failed. Please try again.';
          break;
        case 'token_exchange_failed':
          errorMessage = 'Failed to exchange authorization code. Please try again.';
          break;
        case 'update_failed':
          errorMessage = 'Failed to save TikTok connection. Please try again.';
          break;
        case 'not_logged_in':
          errorMessage = 'You must be logged in to connect TikTok.';
          break;
        case 'missing_parameters':
          errorMessage = 'Missing required parameters from TikTok.';
          break;
        default:
          errorMessage = `Connection failed: ${error}`;
      }

      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      setTimeout(() => {
        navigate(getRedirectPath());
      }, 3000);
    }
  }, [searchParams, navigate, toast]);

  const returnTo = searchParams.get('return_to') || 'tiktok-lab';
  const redirectLabel = returnTo === 'onboarding' ? 'creator onboarding' : 'Goldsainte Creator Lab';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-lg ring-1 ring-border">
        <div className="flex flex-col items-center gap-4">
          {status === 'processing' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-foreground" />
              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground">
                  Connecting TikTok...
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Please wait while we complete the connection.
                </p>
              </div>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  className="h-6 w-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground">
                  Success!
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Redirecting to {redirectLabel}...
                </p>
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground">
                  Connection Failed
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Redirecting back to {redirectLabel}...
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
