import { useNavigate } from 'react-router-dom';
import { AccountTypeStep } from '@/components/auth/AccountTypeStep';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import logomark from '@/assets/logomark-gold.png';

export default function CompleteProfile() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  const handleComplete = () => {
    // Navigate to home, the auth flow will handle dashboard redirect
    navigate('/', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="animate-pulse">Loading...</div>
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
