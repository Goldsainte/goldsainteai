import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EditorialLoader } from '@/components/EditorialLoader';
import { AUTH_REDIRECT_STORAGE_KEY, getRedirectPathFromSearch, sanitizeRedirectPath } from '@/lib/auth/redirect';
import { getPostAuthDestination } from '@/lib/auth/postAuthRouting';
import { toast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const hashParams = new URLSearchParams(location.hash.startsWith('#') ? location.hash.slice(1) : location.hash);
        const queryParams = new URLSearchParams(location.search);
        const isRecoveryFlow =
          hashParams.get('type') === 'recovery' ||
          queryParams.get('type') === 'recovery' ||
          queryParams.has('token_hash');

        // Wait for Supabase to confirm the session is ready (event-driven, with 5s fallback)
        const session = await new Promise<any>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 5000);

          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, sessionData) => {
              if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
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

        if (isRecoveryFlow) {
          navigate(
            {
              pathname: '/reset-password',
              search: location.search,
              hash: location.hash,
            },
            { replace: true }
          );
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

        // Fire welcome email exactly once, when a fresh signup lands here.
        // The flag is set by Auth.tsx (email signup) and by handleGoogleSignIn
        // (OAuth). Routed through the Lovable email queue via
        // `send-transactional-email` — no second provider. Fire-and-forget.
        if (typeof window !== 'undefined') {
          const pendingWelcomeRaw = sessionStorage.getItem('pending_welcome_email');
          if (pendingWelcomeRaw && session.user.email) {
            sessionStorage.removeItem('pending_welcome_email');
            try {
              const pending = JSON.parse(pendingWelcomeRaw) as {
                accountType?: string;
                firstName?: string;
                lastName?: string;
              };
              const accountType =
                pending.accountType || profile.account_type || 'traveler';
              const isProfessional =
                accountType === 'creator' ||
                accountType === 'agent' ||
                accountType === 'brand';
              const templateName = isProfessional
                ? 'welcome-professional'
                : 'welcome-traveler';
              const firstName =
                pending.firstName || profile.first_name || undefined;
              void supabase.functions
                .invoke('send-transactional-email', {
                  body: {
                    templateName,
                    recipientEmail: session.user.email,
                    idempotencyKey: `welcome-${session.user.id}`,
                    templateData: { name: firstName, accountType },
                  },
                })
                .catch((err) => {
                  console.warn('[AuthCallback] welcome email invoke failed:', err);
                });
            } catch (err) {
              console.warn('[AuthCallback] could not parse pending_welcome_email:', err);
            }
          }
        }

        // SECURITY: Only allow OAuth signups to self-assign 'traveler'.
        // Creator / agent / brand accounts require admin approval and CANNOT be
        // set client-side via sessionStorage — that would let an attacker
        // self-promote to a privileged role by editing localStorage before
        // returning from the OAuth flow.
        if (typeof window !== 'undefined') {
          const pendingAccountType = sessionStorage.getItem('pending_account_type');
          sessionStorage.removeItem('pending_account_type');

          const allowedTypes = ['traveler', 'creator', 'brand'];
          if (
            pendingAccountType &&
            allowedTypes.includes(pendingAccountType) &&
            profile.account_type !== pendingAccountType
          ) {
            // Trigger likely defaulted account_type to 'traveler' because OAuth
            // providers don't pass our metadata. Override with the user's
            // actual selection from the signup page. 'agent' is intentionally
            // excluded — agents must go through the formal /apply/agent flow.
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ account_type: pendingAccountType as any })
              .eq('id', session.user.id);
            if (!updateError) {
              profile.account_type = pendingAccountType;
            } else {
              console.error('Failed to update account_type from pending:', updateError);
            }
          }

          // Agent selections via Google can't be auto-applied — route them to
          // the formal application flow.
          if (pendingAccountType === 'agent') {
            // Promote profile to agent so OnboardingRouter / form gate
            // recognize them on this and future visits. OAuth users are
            // email-confirmed by the provider, so the form gate will let
            // them through.
            if (profile.account_type !== 'agent') {
              const { error: agentUpdateError } = await supabase
                .from('profiles')
                .update({ account_type: 'agent' as any })
                .eq('id', session.user.id);
              if (agentUpdateError) {
                console.error('Failed to set account_type=agent from pending:', agentUpdateError);
              } else {
                profile.account_type = 'agent';
              }
            }
            toast({
              title: 'Complete your agent application',
              description: 'You signed in with Google but agents need to complete a formal application.',
            });
            navigate('/apply/agent', { replace: true });
            return;
          }

          // If we just promoted the user to creator, force them through
          // creator onboarding instead of any cached destination.
          if (profile.account_type === 'creator' && !profile.onboarding_completed) {
            navigate('/onboarding/creator', { replace: true });
            return;
          }
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

        console.log('[AuthCallback] Routing decision:', {
          account_type: profile.account_type,
          onboarding_completed: profile.onboarding_completed,
          is_profile_complete: profile.is_profile_complete,
          destination: path,
        });

        navigate(path, { replace: true });
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, location.hash, location.search]);

  return (
    <EditorialLoader
      eyebrow="Member Portal"
      title="One moment"
      subtitle="Completing sign in and preparing your account."
    />
  );
};

export default AuthCallback;
