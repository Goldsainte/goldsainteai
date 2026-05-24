import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EditorialLoader } from '@/components/EditorialLoader';
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

  const title =
    status === 'success'
      ? 'Connected'
      : status === 'error'
      ? 'Connection Issue'
      : 'Connecting';
  const subtitle =
    status === 'success'
      ? `Redirecting to ${redirectLabel}.`
      : status === 'error'
      ? `Redirecting back to ${redirectLabel}.`
      : 'Verifying your TikTok account.';

  return (
    <EditorialLoader
      eyebrow="TikTok"
      title={title}
      subtitle={subtitle}
      status={status}
    />
  );
}
