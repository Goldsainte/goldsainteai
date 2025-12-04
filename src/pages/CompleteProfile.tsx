import { useNavigate } from 'react-router-dom';
import { AccountTypeStep } from '@/components/auth/AccountTypeStep';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logomark from '@/assets/logomark-gold.png';
import { Loader2 } from 'lucide-react';

export default function CompleteProfile() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
      return;
    }

    // Check if user already has an account type set (from signup metadata)
    async function checkExistingAccountType() {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .maybeSingle();

        // If account type is already set, skip role selection and go directly to onboarding
        if (profile?.account_type) {
          navigate('/onboarding', { replace: true });
          return;
        }
      } catch (err) {
        console.error('Error checking profile:', err);
      }
      
      setCheckingProfile(false);
    }

    if (user && !isLoading) {
      checkExistingAccountType();
    }
  }, [user, isLoading, navigate]);

  const handleComplete = () => {
    // Navigate to onboarding to complete profile setup
    navigate('/onboarding', { replace: true });
  };

  if (isLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src={logomark} 
            alt="Goldsainte" 
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Complete Your Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Just a few more details to get started
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <AccountTypeStep onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
