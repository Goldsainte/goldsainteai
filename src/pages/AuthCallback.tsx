import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        navigate('/auth');
        return;
      }

      if (session) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile) {
          // Create profile if it doesn't exist
          await supabase.from('profiles').insert({
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url,
            account_type: 'personal'
          });
        }

        // Honor returnTo from query params or sessionStorage
        const params = new URLSearchParams(window.location.search);
        const returnTo = params.get('returnTo') || sessionStorage.getItem('returnTo');
        sessionStorage.removeItem('returnTo');
        
        navigate(returnTo?.startsWith('/') ? returnTo : '/', { replace: true });
      } else {
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate]);

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
