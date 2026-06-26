import { useNavigate, useSearchParams } from 'react-router-dom';
import { AccountTypeStep } from '@/components/auth/AccountTypeStep';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logomark from '@/assets/logomark-gold.png';
import { Loader2 } from 'lucide-react';

export default function CompleteProfile() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
      return;
    }

    // Only skip this screen for users who have ALREADY finished setup.
    // A fresh Google signup arrives here with account_type='traveler'
    // (trigger default) but is_profile_complete=false and no name —
    // they still need to pick a role and enter their identity, so we
    // must show the form.
    async function checkExistingAccountType() {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type, is_profile_complete, onboarding_completed, first_name')
          .eq('id', user.id)
          .maybeSingle();

        const isFinished =
          profile?.is_profile_complete === true ||
          profile?.onboarding_completed === true ||
          Boolean(profile?.first_name && String(profile.first_name).trim());

        if (profile?.account_type && isFinished) {
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
      <div className="min-h-screen flex items-center justify-center bg-[#FDF9F0]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C7A962]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF9F0] p-4">
      <div className="w-full max-w-md md:max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src={logomark} 
            alt="Goldsainte" 
            className="h-14 w-auto mx-auto mb-6"
          loading="lazy"/>
          <h1 className="text-3xl font-secondary text-[#0a2225] mb-2">
            Complete Your Profile
          </h1>
          <p className="text-base text-[#6B7280]">
            Just a few more details to get started
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5DFC6] rounded-3xl p-8 shadow-lg">
          <AccountTypeStep onComplete={handleComplete} defaultType={action === 'ask' ? 'traveler' : undefined} />
        </div>
      </div>
    </div>
  );
}
