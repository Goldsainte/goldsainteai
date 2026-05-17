import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as Sentry from '@sentry/react';
import { useIsMobile } from '@/hooks/use-mobile';
import logomark from '@/assets/logomark-gold.png';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { AccountTypeStep } from '@/components/auth/AccountTypeStep';
import { getPostAuthDestination } from '@/lib/auth/postAuthRouting';
import { AUTH_REDIRECT_STORAGE_KEY, getRedirectPathFromSearch, sanitizeRedirectPath } from '@/lib/auth/redirect';

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

type AuthStep = 'account-type' | 'email' | 'signin' | 'signup' | 'forgot-password' | 'verify-email' | 'profile';
type AccountType = 'traveler' | 'creator' | 'agent' | 'brand' | null;

const AUTH_FLOW_STORAGE_KEY = 'goldsainte:authFlow';

type PersistedAuthFlow = {
  step: AuthStep;
  selectedAccountType: AccountType;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  smsOptIn: boolean;
};

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const mode = searchParams.get('mode');
  const roleFromUrl = searchParams.get('role') as AccountType | null;
  const persistedFlow = useMemo<PersistedAuthFlow | null>(() => {
    if (typeof window === 'undefined') return null;

    try {
      const raw = sessionStorage.getItem(AUTH_FLOW_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PersistedAuthFlow) : null;
    } catch {
      return null;
    }
  }, []);
  
  const getInitialStep = (): AuthStep => {
    if (mode === 'signup') {
      if (roleFromUrl && ['traveler', 'creator', 'agent', 'brand'].includes(roleFromUrl)) {
        return 'email';
      }
      return 'account-type';
    }
    return 'email';
  };
  
  const [step, setStep] = useState<AuthStep>(persistedFlow?.step ?? getInitialStep);
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>(
    persistedFlow?.selectedAccountType ?? (roleFromUrl && ['traveler', 'creator', 'agent', 'brand'].includes(roleFromUrl) ? roleFromUrl : null)
  );
  const [email, setEmail] = useState(persistedFlow?.email ?? '');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState(persistedFlow?.firstName ?? '');
  const [lastName, setLastName] = useState(persistedFlow?.lastName ?? '');
  const [phone, setPhone] = useState(persistedFlow?.phone ?? '');
  const [smsOptIn, setSmsOptIn] = useState(persistedFlow?.smsOptIn ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const redirectTarget = useMemo(() => getRedirectPathFromSearch(location.search), [location.search]);
  
  const isSignUpMode = mode === 'signup' || step === 'account-type' || step === 'signup';

  const persistRedirectTargetForOAuth = () => {
    if (typeof window === 'undefined') return;
    const destination = redirectTarget ?? '/';
    sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, destination);
  };

  const clearPersistedAuthFlow = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(AUTH_FLOW_STORAGE_KEY);
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const storedRedirect = typeof window !== 'undefined'
        ? sanitizeRedirectPath(sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY))
        : null;
      const destination = redirectTarget ?? storedRedirect;

      if (destination) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
        }
        clearPersistedAuthFlow();
        navigate(destination, { replace: true });
        return;
      }

      const routeAfterAuth = async () => {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("account_type, onboarding_completed, is_profile_complete")
            .eq("id", user.id)
            .maybeSingle();

          if (error) {
            console.error("Error fetching profile:", error);
            navigate("/onboarding", { replace: true });
            return;
          }

          const path = getPostAuthDestination(
            profile?.account_type ?? null,
            profile?.onboarding_completed ?? false,
            profile?.is_profile_complete ?? false
          );

          clearPersistedAuthFlow();
          navigate(path, { replace: true });
        } catch (error) {
          console.error("Error determining post-auth destination:", error);
          navigate("/onboarding", { replace: true });
        }
      };

      routeAfterAuth();
    }
  }, [user, authLoading, navigate, redirectTarget]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (redirectTarget) {
      sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, redirectTarget);
    } else {
      sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
    }
  }, [redirectTarget]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const shouldPersist =
      step === 'signup' ||
      step === 'verify-email' ||
      (step === 'email' && (!!email || !!selectedAccountType));

    if (!shouldPersist) {
      sessionStorage.removeItem(AUTH_FLOW_STORAGE_KEY);
      return;
    }

    sessionStorage.setItem(
      AUTH_FLOW_STORAGE_KEY,
      JSON.stringify({
        step,
        selectedAccountType,
        email,
        firstName,
        lastName,
        phone,
        smsOptIn,
      } satisfies PersistedAuthFlow)
    );
  }, [step, selectedAccountType, email, firstName, lastName, phone, smsOptIn]);

  // Cross-device email verification: poll session + listen for auth changes
  // while sitting on the verify-email step, so the desktop tab advances even
  // when the user clicks the confirmation link on their phone.
  useEffect(() => {
    if (step !== 'verify-email') return;

    let cancelled = false;

    const handleVerified = () => {
      if (cancelled) return;
      cancelled = true;
      toast({ title: 'Email verified', description: 'Taking you to finish setting up your profile.' });
      navigate('/auth/complete-profile', { replace: true });
    };

    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email_confirmed_at) {
          clearInterval(interval);
          handleVerified();
        } else if (session?.user) {
          // Refresh the user object in case email_confirmed_at hasn't propagated to session
          const { data: { user: freshUser } } = await supabase.auth.getUser();
          if (freshUser?.email_confirmed_at) {
            clearInterval(interval);
            handleVerified();
          }
        }
      } catch (err) {
        // Silent — we'll try again on the next tick
      }
    }, 3000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') &&
          session?.user?.email_confirmed_at) {
        clearInterval(interval);
        handleVerified();
      }
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [step, navigate, toast]);

  const handleContinueWithEmail = () => {
    if (!email.trim()) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (isSignUpMode || selectedAccountType) {
      // For signup, an account type must be chosen first
      if (!selectedAccountType) {
        setStep('account-type');
        return;
      }
      setStep('signup');
    } else {
      setStep('signin');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setStep("verify-email");
        try {
          const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
          if (resendError) {
            toast({ title: "Email not confirmed", description: "We couldn't resend the confirmation email. Please try again shortly.", variant: "destructive" });
          } else {
            toast({ title: "Verify your email", description: "We've sent you a new email confirmation link. Please check your inbox." });
          }
        } catch (err) {
          console.error("Error resending verification email:", err);
        }
        setIsLoading(false);
        return;
      }
      toast({ title: "Sign in failed", description: error.message || "Please check your credentials and try again.", variant: "destructive" });
      setIsLoading(false);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_type, is_profile_complete, onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();
        if (!profile?.account_type && !profile?.is_profile_complete) {
          setStep('profile');
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        const storedRedirect = typeof window !== 'undefined'
          ? sanitizeRedirectPath(sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY))
          : null;
        const destination = redirectTarget ?? storedRedirect;
        if (destination) {
          if (typeof window !== 'undefined') sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
          navigate(destination, { replace: true });
          return;
        }
        const postAuthPath = getPostAuthDestination(
          profile?.account_type ?? null,
          profile?.onboarding_completed ?? false,
          profile?.is_profile_complete ?? false
        );
        navigate(postAuthPath, { replace: true });
        return;
      }
      setIsLoading(false);
      navigate('/marketplace', { replace: true });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!normalizedEmail) {
      toast({ title: "Email required", description: "Please enter your email address before creating your account.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: "Missing information", description: "Please enter your first and last name.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    // Phone is optional for signup

    if (selectedAccountType === 'agent') {
      toast({ title: "Complete Your Application", description: "You'll be redirected to the agent application form." });
      navigate('/apply/agent', { state: { email: normalizedEmail, firstName, lastName, phone, smsOptIn } });
      setIsLoading(false);
      return;
    }
    if (selectedAccountType === 'brand') {
      toast({ title: "Complete Your Application", description: "You'll be redirected to the brand application form." });
      navigate('/brand/onboarding', { state: { email: normalizedEmail, firstName, lastName, phone, smsOptIn } });
      setIsLoading(false);
      return;
    }
    
    if (selectedAccountType !== 'traveler' && selectedAccountType !== 'creator') {
      toast({ title: "Choose an account type", description: "Please tell us how you'll use Goldsainte." });
      setStep('account-type');
      setIsLoading(false);
      return;
    }

    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      toast({ title: "Invalid password", description: passwordValidation.error.errors[0].message, variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
            phone_number: phone || null,
            account_type: selectedAccountType,
            sms_notifications: smsOptIn,
          },
        },
      });

      if (error) {
        console.error("Sign up error:", error);
        let title = "Could not create your account";
        let description = error.message || "An unexpected error occurred.";
        const msg = error.message?.toLowerCase() || "";

        if (msg.includes("already registered") || msg.includes("already been registered")) {
          title = "Account already exists";
          description = "An account with this email already exists. Try signing in instead.";
        } else if (msg.includes("failed to fetch") || msg.includes("network")) {
          title = "Connection issue";
          description = "Unable to reach our servers. Check your internet and try again.";
        } else if (msg.includes("rate limit") || msg.includes("too many")) {
          title = "Too many attempts";
          description = "Please wait a minute and try again.";
        } else if (msg.includes("password")) {
          title = "Password issue";
          description = error.message;
        } else if (msg.includes("email")) {
          title = "Email issue";
          description = error.message;
        }

        toast({ title, description, variant: "destructive" });
        Sentry.captureException(error, {
          tags: { flow: 'signup' },
          extra: { emailDomain: normalizedEmail.split('@')[1] },
        });
        setIsLoading(false);
        return;
      }

      setStep("verify-email");
      setIsLoading(false);
    } catch (error: any) {
      console.error("Unexpected signup error:", error);
      toast({ title: "Sign up failed", description: error?.message || "An unexpected error occurred.", variant: "destructive" });
      Sentry.captureException(error, { tags: { flow: 'signup', phase: 'unexpected' } });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      persistRedirectTargetForOAuth();
      // Pass selectedAccountType via sessionStorage so it survives the OAuth roundtrip
      // and AuthCallback can backfill the profile if the trigger defaulted to 'traveler'.
      if (selectedAccountType) {
        sessionStorage.setItem('pending_account_type', selectedAccountType);
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: 'Google sign-in failed', description: error.message || 'Please try again.', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Reset email sent", description: "Check your email for a password reset link from Goldsainte." });
      setStep('email');
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to send reset email.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleProfileComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();
    const storedRedirect = typeof window !== 'undefined'
      ? sanitizeRedirectPath(sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY))
      : null;
    const destination = redirectTarget ?? storedRedirect;
    if (destination) {
      if (typeof window !== 'undefined') sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
      clearPersistedAuthFlow();
      navigate(destination, { replace: true });
      return;
    }
    const postAuthDestination = getPostAuthDestination(profile?.account_type, profile?.onboarding_completed);
    clearPersistedAuthFlow();
    navigate(postAuthDestination, { replace: true });
  };

  // Loading state
  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF9F0' }}>
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto" style={{ color: '#C7A962' }} />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Auth card content
  const authCard = (
    <div className="w-full max-w-md mx-auto">
      <div 
        className="w-full rounded-[2rem] p-8 sm:p-10 md:p-12"
        style={{ 
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E2D0',
          boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(199, 169, 98, 0.04) inset',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logomark} alt="Goldsainte" className="h-14 w-14" loading="lazy"/>
        </div>

        {/* Account Type Step */}
        {step === 'account-type' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-secondary tracking-tight" style={{ color: '#0a2225' }}>
                Welcome to Goldsainte
              </h1>
              <p className="text-sm mt-2 tracking-wide uppercase" style={{ color: '#9A9384', letterSpacing: '0.12em', fontSize: '11px' }}>
                Select how you want to shape your next adventure
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {([
                { type: 'traveler' as AccountType, label: 'Traveler', desc: 'Book and plan luxury travel experiences' },
                { type: 'creator' as AccountType, label: 'Creator', desc: 'Share travel content and inspire others' },
                { type: 'agent' as AccountType, label: 'Travel Agent', desc: 'Professional agents · Application required' },
                { type: 'brand' as AccountType, label: 'Brand / Hotel', desc: 'Hotels & lifestyle brands · Application required' },
              ]).map(({ type, label, desc }) => (
                <button
                  key={type}
                  onClick={() => { setSelectedAccountType(type); setStep('email'); }}
                  className="p-5 rounded-2xl border transition-all text-left group"
                  style={{ 
                    borderColor: '#E8E2D0', 
                    backgroundColor: '#FFFFFF',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#C7A962';
                    e.currentTarget.style.boxShadow = '0 2px 12px -4px rgba(199, 169, 98, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E8E2D0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="font-secondary text-base" style={{ color: '#0a2225' }}>{label}</div>
                  <div className="text-sm mt-0.5" style={{ color: '#9A9384' }}>{desc}</div>
                </button>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setSelectedAccountType(null); setStep('email'); navigate('/auth', { replace: true }); }}
                className="text-sm font-medium hover:underline"
                style={{ color: '#C7A962' }}
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        )}

        {/* Email Step */}
        {step === 'email' && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-secondary tracking-tight" style={{ color: '#0a2225' }}>
                {isSignUpMode ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="mt-2 tracking-wide" style={{ color: '#9A9384', letterSpacing: '0.08em', fontSize: '12px' }}>
                {isSignUpMode 
                  ? 'Start designing your perfect journey'
                  : 'Pick up where you left off'}
              </p>
            </div>
            <div className="space-y-4">
              {/* Social Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full h-12 rounded-full flex items-center justify-center gap-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ 
                    border: '1px solid #E8E2D0', 
                    backgroundColor: '#FFFFFF',
                    color: '#0a2225',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = '#C7A962';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                    e.currentTarget.style.borderColor = '#E8E2D0';
                  }}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              {/* OR Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full" style={{ borderTop: '1px solid #E8E2D0' }} />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-[10px] uppercase tracking-[0.2em]" style={{ backgroundColor: '#FFFFFF', color: '#B8B0A0' }}>
                    or
                  </span>
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-12 rounded-xl border focus:ring-2 focus:ring-offset-0"
                  style={{ borderColor: '#E8E2D0' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleContinueWithEmail(); }}
                />
                <Button 
                  className="w-full h-12 rounded-full text-sm font-medium"
                  style={{ backgroundColor: '#0c4d47', color: '#E5DFC6' }}
                  onClick={handleContinueWithEmail}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</>
                  ) : 'Continue'}
                </Button>
              </div>

              {/* Footer Links */}
              <div className="mt-8 space-y-3 text-center">
                {isSignUpMode ? (
                  <button
                    type="button"
                    onClick={() => { setSelectedAccountType(null); setStep('email'); navigate('/auth', { replace: true }); }}
                    className="block w-full text-sm font-medium hover:underline"
                    style={{ color: '#C7A962' }}
                  >
                    Already have an account? Sign in
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep('account-type')}
                    className="block w-full text-sm font-medium hover:underline"
                    style={{ color: '#C7A962' }}
                  >
                    New to Goldsainte? Create an account
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const returnTo = getRedirectPathFromSearch(location.search);
                    navigate(returnTo || '/');
                  }}
                  className="block w-full text-sm transition-colors"
                  style={{ color: '#9A9384' }}
                >
                  Continue without signing in
                </button>
              </div>
            </div>
          </>
        )}

        {/* Sign In Step */}
        {step === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="text-sm mb-4" style={{ color: '#9A9384' }}>
              Signing in as <span className="font-medium" style={{ color: '#0a2225' }}>{email}</span>
              {' '}
              <button type="button" onClick={() => setStep('email')} className="hover:underline" style={{ color: '#C7A962' }}>
                Change
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#0a2225' }}>Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 rounded-xl"
                style={{ borderColor: '#E8E2D0' }}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-full"
              style={{ backgroundColor: '#0c4d47', color: '#E5DFC6' }}
              disabled={isLoading}
            >
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => setStep('email')} className="transition-colors" style={{ color: '#9A9384' }}>
                ← Back
              </button>
              <button type="button" onClick={() => setStep('forgot-password')} className="hover:underline" style={{ color: '#C7A962' }}>
                Forgot password?
              </button>
            </div>
            <div className="mt-3 text-center text-sm">
              <button type="button" onClick={() => setStep('signup')} className="hover:underline" style={{ color: '#9A9384' }}>
                Need an account? Create one instead
              </button>
            </div>
          </form>
        )}

        {/* Phone Sign In Step */}
        {/* Sign Up Step */}
        {step === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-secondary tracking-tight" style={{ color: '#0a2225' }}>
                {selectedAccountType === 'agent' && "Apply as Travel Agent"}
                {selectedAccountType === 'brand' && "Apply as Brand"}
                {selectedAccountType === 'traveler' && "Create Traveler Account"}
                {selectedAccountType === 'creator' && "Create Creator Account"}
              </h1>
              <p className="text-sm mt-2" style={{ color: '#9A9384' }}>
                {(selectedAccountType === 'agent' || selectedAccountType === 'brand') 
                  ? "We'll redirect you to complete your application"
                  : "Enter your details to get started"
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signupEmail" className="text-sm font-medium" style={{ color: '#0a2225' }}>Email address</Label>
              {selectedAccountType === 'agent' && (
                <p className="text-xs text-[#6B7280] mb-3 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-[#9A9384]" />
                  <span>Travel agents sign up with email for business correspondence and verification.</span>
                </p>
              )}
              <Input id="signupEmail" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="h-12 rounded-xl" style={{ borderColor: '#E8E2D0' }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium" style={{ color: '#0a2225' }}>First Name</Label>
                <Input id="firstName" type="text" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={isLoading} className="h-12 rounded-xl" style={{ borderColor: '#E8E2D0' }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium" style={{ color: '#0a2225' }}>Last Name</Label>
                <Input id="lastName" type="text" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={isLoading} className="h-12 rounded-xl" style={{ borderColor: '#E8E2D0' }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium" style={{ color: '#0a2225' }}>Phone Number <span style={{ color: '#9A9384' }}>(optional)</span></Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isLoading} className="h-12 rounded-xl" style={{ borderColor: '#E8E2D0' }} />
            </div>

            <div className="flex items-start space-x-3 pt-1">
              <Checkbox
                id="smsOptIn"
                checked={smsOptIn}
                onCheckedChange={(checked) => setSmsOptIn(checked === true)}
                disabled={isLoading}
                className="mt-0.5 h-4 w-4"
                style={{ borderColor: '#E8E2D0' }}
              />
              <div className="space-y-1">
                <Label htmlFor="smsOptIn" className="text-sm font-medium leading-none cursor-pointer" style={{ color: '#0a2225' }}>
                  Text message notifications
                </Label>
                <p className="text-sm" style={{ color: '#9A9384' }}>
                  Receive trip updates, booking confirmations, and travel alerts via SMS. Message and data rates may apply.
                </p>
              </div>
            </div>

            {(selectedAccountType === 'traveler' || selectedAccountType === 'creator') && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#0a2225' }}>Password</Label>
                <Input id="password" type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className="h-12 rounded-xl" style={{ borderColor: '#E8E2D0' }} minLength={8} />
                <div className="text-sm space-y-1" style={{ color: '#9A9384' }}>
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside pl-2 space-y-0.5">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                    <li>One special character</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setSelectedAccountType(null); setStep('email'); }}
                className="flex-1 h-12 rounded-xl"
                style={{ borderColor: '#E8E2D0', color: '#0a2225' }}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="submit" 
                className="flex-1 h-12 rounded-xl"
                style={{ backgroundColor: '#0c4d47', color: '#E5DFC6' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                ) : (selectedAccountType === 'agent' || selectedAccountType === 'brand') ? (
                  'Continue to Application'
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>

            {(selectedAccountType === 'agent' || selectedAccountType === 'brand') && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAccountType('traveler');
                    toast({ title: "Switched to Traveler", description: "You can always apply as an agent or brand later from your profile." });
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  Skip for now
                </button>
              </div>
            )}
          </form>
        )}

        {/* Verify Email Step */}
        {step === 'verify-email' && (
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-secondary tracking-tight" style={{ color: '#0a2225' }}>
                Confirm your email
              </h2>
              <p className="text-sm max-w-sm mx-auto" style={{ color: '#9A9384' }}>
                We've sent a confirmation link to{' '}
                <span className="font-medium" style={{ color: '#0a2225' }}>{email}</span>
              </p>
              <p className="text-sm max-w-md mx-auto mt-2" style={{ color: '#9A9384' }}>
                Please click the link in that email to verify your address and activate your Goldsainte account. Check your spam folder if you don't see it.
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <Button
                type="button"
                className="w-full h-12 rounded-full"
                style={{ backgroundColor: '#0c4d47', color: '#E5DFC6' }}
                onClick={async () => {
                  if (!email) return;
                  setIsLoading(true);
                  try {
                    const { error } = await supabase.auth.resend({ type: "signup", email });
                    if (error) {
                      toast({ title: "Could not resend email", description: error.message, variant: "destructive" });
                    } else {
                      toast({ title: "Email sent", description: "We've resent the confirmation email to your inbox." });
                    }
                  } catch (err: any) {
                    toast({ title: "Error", description: err?.message || "Failed to resend email", variant: "destructive" });
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Resend confirmation email'}
              </Button>
              <button type="button" onClick={() => setStep("email")} className="block w-full text-sm transition-colors" style={{ color: '#9A9384' }}>
                Use a different email
              </button>
            </div>
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid #E8E2D0' }}>
              <p className="text-sm" style={{ color: '#9A9384' }}>
                Once you verify your email, you'll be redirected back to complete your profile.
              </p>
              <button
                type="button"
                onClick={async () => {
                  const { data: { user: freshUser } } = await supabase.auth.getUser();
                  if (freshUser?.email_confirmed_at) {
                    navigate('/auth/complete-profile', { replace: true });
                  } else {
                    toast({
                      title: "Not verified yet",
                      description: "We don't see a confirmation yet. Click the link in your email, then try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className="mt-3 text-sm font-medium hover:underline transition-colors"
                style={{ color: '#0c4d47' }}
              >
                Already verified? Continue →
              </button>
            </div>
          </div>
        )}

        {/* Forgot Password Step */}
        {step === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-medium" style={{ color: '#0a2225' }}>Email</Label>
              <Input id="reset-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="h-12 rounded-xl" style={{ borderColor: '#E8E2D0' }} />
              <p className="text-sm" style={{ color: '#9A9384' }}>
                We'll send you a link to reset your password.
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-full"
              style={{ backgroundColor: '#0c4d47', color: '#E5DFC6' }}
              disabled={isLoading}
            >
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send Reset Link'}
            </Button>
            <div className="text-center">
              <button type="button" onClick={() => setStep('signin')} className="text-sm transition-colors" style={{ color: '#9A9384' }}>
                ← Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* Profile Step */}
        {step === 'profile' && (
          <AccountTypeStep onComplete={handleProfileComplete} />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#FDF9F0' }}>
      {/* Left: Editorial hero image (desktop only) */}
      <div 
        className="hidden md:block w-1/2 relative bg-cover bg-center"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80&auto=format&fit=crop)',
        }}
      >
        {/* Dark overlay for editorial feel */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,34,37,0.3) 0%, rgba(10,34,37,0.15) 50%, rgba(10,34,37,0.4) 100%)' }} />
        {/* Bottom editorial text */}
        <div className="absolute bottom-12 left-10 right-10">
          <p className="font-secondary text-3xl leading-snug" style={{ color: '#FFFFFF', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            Design the journey<br />before you live it.
          </p>
          <p className="mt-3 text-sm tracking-wide" style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }}>
            GOLDSAINTE
          </p>
        </div>
      </div>

      {/* Right: Auth card */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-10">
        {authCard}
      </div>
    </div>
  );
};

export default Auth;
