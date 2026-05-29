import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EditorialLoader } from '@/components/EditorialLoader';

/**
 * /auth/verify — Email confirmation landing page.
 *
 * Supabase sends confirmation links pointing here:
 *   https://goldsainte.ai/auth/verify?token=<token_hash>&type=signup&redirect_to=...
 *
 * This page calls supabase.auth.verifyOtp() client-side so the raw Supabase
 * project URL never appears in outbound emails.
 */
const AuthVerify = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const verify = async () => {
      const token_hash = searchParams.get('token') ?? searchParams.get('token_hash') ?? '';
      const type = (searchParams.get('type') ?? 'signup') as Parameters<typeof supabase.auth.verifyOtp>[0]['type'];
      const redirectTo = searchParams.get('redirect_to');

      if (!token_hash) {
        navigate('/auth?error=invalid_link', { replace: true });
        return;
      }

      const { error } = await supabase.auth.verifyOtp({ token_hash, type });

      if (error) {
        console.error('[AuthVerify] verifyOtp error', error.message);
        navigate(`/auth?error=${encodeURIComponent(error.message)}`, { replace: true });
        return;
      }

      // Route based on email type:
      // - recovery  → reset-password page
      // - email_change → auth/callback (session already updated)
      // - everything else → auth/callback for normal post-login routing
      if (type === 'recovery') {
        navigate('/reset-password', { replace: true });
        return;
      }

      // For all other types, honour redirect_to if it's a relative path on this
      // domain, otherwise fall through to /auth/callback.
      let destination = '/auth/callback';
      if (redirectTo) {
        try {
          const url = new URL(redirectTo);
          if (url.origin === window.location.origin) {
            destination = url.pathname + url.search;
          }
        } catch {
          // redirectTo was already a relative path
          if (redirectTo.startsWith('/')) destination = redirectTo;
        }
      }

      navigate(destination, { replace: true });
    };

    verify();
  }, [navigate, searchParams]);

  return <EditorialLoader />;
};

export default AuthVerify;
