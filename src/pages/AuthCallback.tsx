import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { AUTH_REDIRECT_STORAGE_KEY, getRedirectPathFromSearch, sanitizeRedirectPath } from '@/lib/auth/redirect';
import { getPostAuthDestination } from '@/lib/auth/postAuthRouting';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Wait for Supabase to confirm the session is ready (event-driven, with 5s fallback)
        const session = await new Promise<any>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 5000);

          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, sessionData) => {
              if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                clearTimeout(timeout);
                subscription.unsubscribe();
                resolve(sessionData);
              }
            }
          );

          supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
              clearTimeout(timeout);
              subscription.unsubscribe();
              resolve(data.session);
            }
          });
        });

        if (!session) {
          navigate('/auth', { replace: true });
          return;
        }

        // The handle_new_user trigger on auth.users is the single source of truth
        // for profile creation. We READ here (with retry/backoff) — never insert —
        // to avoid racing the trigger and overwriting its metadata-derived account_type.
        let profile: any = null;
        let profileError: any = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 200));
          const res = await supabase
            .from('profiles')
            .select('id, is_profile_complete, account_type, onboarding_completed, role, first_name, last_name, phone')
            .eq('id', session.user.id)
            .maybeSingle();
          profile = res.data;
          profileError = res.error;
          if (profile) break;
          if (profileError && profileError.code !== 'PGRST116') break;
        }

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile query error:', profileError);
          navigate('/auth');
          return;
        }

        if (!profile) {
          console.error('Profile not created by trigger after 5 retries');
          const { toast } = await import('@/hooks/use-toast');
          toast({
            title: 'Account setup failed',
            description: 'Please try signing up again or contact support.',
            variant: 'destructive',
          });
          navigate('/auth');
          return;
        }

        // Users with completed onboarding OR is_profile_complete should NOT be redirected
        const hasCompletedOnboarding = profile.onboarding_completed === true;
        const isProfileComplete = profile.is_profile_complete === true;
        const hasValidAccountType = profile.account_type && 
          ['traveler', 'creator', 'agent', 'brand'].includes(profile.account_type);

        // Only redirect to complete-profile if:
        // 1. No account type set, OR
        // 2. Invalid account type AND user has not completed onboarding/profile
        const needsCompletion = !hasValidAccountType && !hasCompletedOnboarding && !isProfileComplete;

        // For brand-new OAuth users (Google/Facebook), the trigger auto-assigns
        // 'traveler' as a default. We previously force-redirected them to
        // /auth/complete-profile to pick a role, which created an infinite loop
        // when CompleteProfile saw account_type='traveler' and bounced them to
        // /onboarding (or when the page failed to render). Instead, trust the
        // default assignment and let the normal traveler onboarding flow run.
        // Users can change their role later from settings.
        if (needsCompletion) {
          navigate('/auth/complete-profile', { replace: true });
          return;
        }

        // Profile and onboarding complete, proceed with redirect
        const redirectFromQuery = getRedirectPathFromSearch(location.search);
        const storedRedirect = typeof window !== 'undefined'
          ? sanitizeRedirectPath(sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY))
          : null;

        // If we have an explicit redirect, respect that
        if (redirectFromQuery || storedRedirect) {
          const destination = redirectFromQuery ?? storedRedirect ?? '/marketplace';
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
          }
          navigate(destination, { replace: true });
          return;
        }

        // Use centralized routing logic for default destinations
        const path = getPostAuthDestination(
          profile.account_type,
          profile.onboarding_completed,
          profile.is_profile_complete
        );

        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
        }

        navigate(path, { replace: true });
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
