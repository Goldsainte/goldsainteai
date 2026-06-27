import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EditorialLoader } from '@/components/EditorialLoader';
import { AUTH_REDIRECT_STORAGE_KEY, getRedirectPathFromSearch, sanitizeRedirectPath } from '@/lib/auth/redirect';
import { getPostAuthDestination } from '@/lib/auth/postAuthRouting';
import { toast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics/events';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Guard against React StrictMode's double-invoke (and any re-render) running
  // the callback twice — which would convert the inquiry and post the question
  // a second time, creating a duplicate message.
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const handleAuthCallback = async () => {
      try {
        const hashParams = new URLSearchParams(location.hash.startsWith('#') ? location.hash.slice(1) : location.hash);
        const queryParams = new URLSearchParams(location.search);
        const isRecoveryFlow =
          hashParams.get('type') === 'recovery' ||
          queryParams.get('type') === 'recovery' ||
          queryParams.has('token_hash');

        // The Supabase client (detectSessionInUrl: true) automatically exchanges
        // the OAuth code in the URL for a session and emits SIGNED_IN. No manual
        // broker call needed here.

        // Wait for Supabase to confirm the session is ready (event-driven, with 5s fallback)
        const session = await new Promise<any>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 10000);

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
              trackEvent('sign_up', { account_type: accountType });
              const isProfessional =
                accountType === 'creator' ||
                accountType === 'agent' ||
                accountType === 'brand';
              // Travelers receive their welcome from the account-type step,
              // which always has their name. Only send the professional
              // welcome here, to avoid sending a duplicate welcome email.
              if (isProfessional) {
                const firstName =
                  pending.firstName || profile.first_name || undefined;
                void supabase.functions
                  .invoke('send-transactional-email', {
                    body: {
                      templateName: 'welcome-professional',
                      recipientEmail: session.user.email,
                      idempotencyKey: `welcome-${session.user.id}`,
                      templateData: { name: firstName, accountType },
                    },
                  })
                  .catch((err) => {
                    console.warn('[AuthCallback] welcome email invoke failed:', err);
                  });
              }
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

          // Only apply a pending account_type override when the profile is
          // BRAND NEW. If the user already has identity fields or has
          // completed onboarding/profile, a stale sessionStorage value from
          // an earlier abandoned signup must not silently change their role.
          const profileHasIdentity = Boolean(
            (profile.first_name && String(profile.first_name).trim()) ||
            (profile.last_name && String(profile.last_name).trim())
          );
          const profileIsBrandNew =
            profile.is_profile_complete !== true &&
            profile.onboarding_completed !== true &&
            !profileHasIdentity;

          const allowedTypes = ['traveler', 'creator', 'brand'];
          if (
            pendingAccountType &&
            allowedTypes.includes(pendingAccountType) &&
            profile.account_type !== pendingAccountType &&
            profileIsBrandNew
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
          if (pendingAccountType === 'agent' && profileIsBrandNew) {
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

        // ── Ask-a-Question conversion ────────────────────────────────────
        // When a user arrives via the trip-inquiry magic link we convert their
        // pending_inquiry into a real conversation and route them straight to
        // it — bypassing the onboarding gate (they complete their profile later
        // via the in-chat banner). An inquiry flow must NEVER land on the
        // profile-completion wall, even when conversion fails.
        const inquiryAction = queryParams.get('action');
        const isInquiryFlow = inquiryAction === 'ask' || inquiryAction === 'open';

        // ── Reply-loop: action=open just opens an existing conversation the
        // user owns. RLS scopes dm_conversations to its participants, so there's
        // nothing to convert — drop them straight into the thread.
        if (inquiryAction === 'open') {
          const conversationParam = queryParams.get('conversation');
          navigate(
            conversationParam ? `/messages?conversation=${conversationParam}` : '/messages',
            { replace: true },
          );
          return;
        }

        if (inquiryAction === 'ask') {
          const tripParam = queryParams.get('trip');
          try {
            // Find the inquiry for this trip (most recent). The question is
            // normally already sent at submit time, so the row carries a
            // conversation_id — we just open it. Click-time creation below is a
            // fallback for when submit-time delivery didn't happen.
            let inquiryQuery = supabase
              .from('pending_inquiries')
              .select('id, question, partner_id, trip_id, trip_title, conversation_id')
              .eq('user_id', session.user.id)
              .order('created_at', { ascending: false })
              .limit(1);
            if (tripParam) inquiryQuery = inquiryQuery.eq('trip_id', tripParam);
            const { data: inquiry } = await inquiryQuery.maybeSingle();

            // Already sent on submit → just open the existing conversation.
            if (inquiry?.conversation_id) {
              trackEvent('inquiry_converted', { trip_id: inquiry.trip_id, conversation_id: inquiry.conversation_id });
              navigate(`/messages?conversation=${inquiry.conversation_id}`, { replace: true });
              return;
            }

            // Fallback: the inquiry has no conversation_id recorded. Prefer
            // opening an EXISTING thread between this traveller and the
            // responder — idempotent, never re-posts the question. Only create
            // one (which posts the question) if none exists yet.
            if (inquiry?.partner_id) {
              const [pa, pb] = [session.user.id, inquiry.partner_id].sort();
              const { data: existingConvo } = await supabase
                .from('dm_conversations')
                .select('id')
                .eq('participant_1', pa)
                .eq('participant_2', pb)
                .maybeSingle();

              if (existingConvo) {
                await supabase
                  .from('pending_inquiries')
                  .update({
                    status: 'converted',
                    conversation_id: existingConvo.id,
                    converted_at: new Date().toISOString(),
                  })
                  .eq('id', inquiry.id);
                trackEvent('inquiry_converted', { trip_id: inquiry.trip_id, conversation_id: existingConvo.id });
                navigate(`/messages?conversation=${existingConvo.id}`, { replace: true });
                return;
              }

              // No thread yet — create it via the canonical path (this posts
              // the question once).
              const { data: dm, error: dmErr } = await supabase.functions.invoke('send-direct-message', {
                body: {
                  recipientId: inquiry.partner_id,
                  message: inquiry.question,
                  tripId: inquiry.trip_id,
                  tripTitle: inquiry.trip_title,
                },
              });

              if (!dmErr && dm?.conversationId) {
                await supabase
                  .from('pending_inquiries')
                  .update({
                    status: 'converted',
                    conversation_id: dm.conversationId,
                    converted_at: new Date().toISOString(),
                  })
                  .eq('id', inquiry.id);

                trackEvent('inquiry_converted', { trip_id: inquiry.trip_id, conversation_id: dm.conversationId });
                navigate(`/messages?conversation=${dm.conversationId}`, { replace: true });
                return;
              }
              console.error('[AuthCallback] send-direct-message failed:', dmErr);
            } else if (inquiry) {
              // No responder on the package (e.g. a concierge trip with no
              // creator and no CONCIERGE_USER_ID). The lead is still captured in
              // pending_inquiries; we just can't open a conversation.
              console.warn('[AuthCallback] inquiry has no responder — lead captured only:', inquiry.id);
            }
          } catch (conversionErr) {
            console.error('[AuthCallback] inquiry conversion failed:', conversionErr);
          }
          // Conversion failed or no responder — still NEVER show the onboarding
          // wall for an inquiry flow. Drop them in their inbox.
          navigate('/messages', { replace: true });
          return;
        }

        // Backstop: any other inquiry flow (e.g. the reply-loop action=open)
        // must also bypass the profile-completion gate.
        if (isInquiryFlow) {
          navigate('/messages', { replace: true });
          return;
        }

        // Users with completed onboarding OR is_profile_complete should NOT be redirected
        const hasCompletedOnboarding = profile.onboarding_completed === true;
        const isProfileComplete = profile.is_profile_complete === true;
        const hasValidAccountType = profile.account_type &&
          ['traveler', 'creator', 'agent', 'brand'].includes(profile.account_type);
        const hasIdentityFields = Boolean(
          (profile.first_name && String(profile.first_name).trim()) ||
          (profile.last_name && String(profile.last_name).trim())
        );

        // Brand-new OAuth users land here with the trigger's default
        // (account_type='traveler', is_profile_complete=false,
        // onboarding_completed=false) and no first/last name. Send them to
        // the role + identity capture page so they can finish setup.
        // Returning users with a completed profile fall through to the
        // normal post-auth routing below.
        const needsCompletion =
          !hasValidAccountType ||
          (!isProfileComplete && !hasCompletedOnboarding && !hasIdentityFields);

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
