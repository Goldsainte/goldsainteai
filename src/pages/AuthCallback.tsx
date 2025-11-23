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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/auth');
          return;
        }

        if (!session) {
          console.log('No session found, redirecting to auth');
          navigate('/auth');
          return;
        }

        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, is_profile_complete, account_type, onboarding_completed, role, first_name, last_name, phone')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile query error:', profileError);
          navigate('/auth');
          return;
        }

        if (!profile) {
          // Create minimal profile for new users (email signup or OAuth)
          const { error: insertError } = await supabase.from('profiles').insert({
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 8)}`,
            avatar_url: session.user.user_metadata?.avatar_url || null,
            is_profile_complete: false,
            account_type: null,
            onboarding_completed: false
          });
          
          if (insertError) {
            console.error('Profile creation error:', insertError);
            // If profile already exists (race condition), try to fetch again
            const { data: retryProfile } = await supabase
              .from('profiles')
              .select('id, is_profile_complete, account_type, onboarding_completed, role')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (!retryProfile) {
              navigate('/auth');
              return;
            }
          }
          
          // New user needs to complete profile
          navigate('/auth/complete-profile', { replace: true });
          return;
        }

        // Check if profile needs completion
        const needsCompletion = !profile.is_profile_complete || 
                                !profile.account_type ||
                                !['traveler', 'creator', 'agent', 'brand'].includes(profile.account_type) ||
                                !profile.first_name ||
                                !profile.last_name ||
                                !profile.phone;

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
          profile.onboarding_completed
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
