import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Parse URL parameters to determine initial step
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const mode = searchParams.get('mode'); // 'signup' | 'signin' | null
  const roleFromUrl = searchParams.get('role') as AccountType | null;
  
  // Determine initial step based on URL mode
  const getInitialStep = (): AuthStep => {
    // Sign Up flow → show role selection first
    if (mode === 'signup') {
      return 'account-type';
    }
    // Sign In flow (default) → go directly to email/password form
    return 'email';
  };
  
  const [step, setStep] = useState<AuthStep>(getInitialStep);
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>(
    roleFromUrl && ['traveler', 'creator', 'agent', 'brand'].includes(roleFromUrl) ? roleFromUrl : null
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const redirectTarget = useMemo(() => getRedirectPathFromSearch(location.search), [location.search]);
  
  // Track if we're in signup mode for UI labels
  const isSignUpMode = mode === 'signup' || step === 'account-type' || step === 'signup';

  const persistRedirectTargetForOAuth = () => {
    if (typeof window === 'undefined') return;
    const destination = redirectTarget ?? '/';
    sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, destination);
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const storedRedirect = typeof window !== 'undefined'
        ? sanitizeRedirectPath(sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY))
        : null;
      const destination = redirectTarget ?? storedRedirect;

      // If we have an explicit redirect (e.g., user tried to access /marketplace),
      // respect that first
      if (destination) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
        }
        navigate(destination, { replace: true });
        return;
      }

      // Otherwise, determine destination based on profile + onboarding status
      const routeAfterAuth = async () => {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("account_type, onboarding_completed, is_profile_complete")
            .eq("id", user.id)
            .maybeSingle();

          if (error) {
            console.error("Error fetching profile:", error);
            // Safe fallback: new users go to onboarding
            navigate("/onboarding", { replace: true });
            return;
          }

          // Use centralized routing logic with all parameters
          const path = getPostAuthDestination(
            profile?.account_type ?? null,
            profile?.onboarding_completed ?? false,
            profile?.is_profile_complete ?? false
          );

          navigate(path, { replace: true });
        } catch (error) {
          console.error("Error determining post-auth destination:", error);
          // Safe fallback for any unexpected errors
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

  const handleContinueWithEmail = () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // If user came from signup flow (selected account type), go to signup form
    if (isSignUpMode || selectedAccountType) {
      setStep('signup');
    } else {
      // Default to sign-in for returning users
      setStep('signin');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      // Check for unverified email
      if (error.message.toLowerCase().includes("email not confirmed")) {
        // Move to verify-email step and resend confirmation
        setStep("verify-email");
        
        try {
          const { error: resendError } = await supabase.auth.resend({
            type: "signup",
            email,
          });
          
          if (resendError) {
            toast({
              title: "Email not confirmed",
              description: "We couldn't resend the confirmation email. Please try again shortly.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Verify your email",
              description: "We've sent you a new email confirmation link. Please check your inbox.",
            });
          }
        } catch (err) {
          console.error("Error resending verification email:", err);
        }
        
        setIsLoading(false);
        return;
      }
      
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      // Check if profile is complete
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_type, is_profile_complete")
          .eq("id", user.id)
          .maybeSingle();

        // Only redirect to profile setup if account_type missing AND not already completed
        // Legacy users with onboarding_completed/is_profile_complete should go to marketplace
        if (!profile?.account_type && !profile?.is_profile_complete) {
          setStep('profile');
          setIsLoading(false);
          return;
        }
      }
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // 🔐 CRITICAL: Validate email before any Supabase calls
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!normalizedEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address before creating your account.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your first and last name.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!phone.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your phone number.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // ===================================================================
    // CRITICAL: Redirect agents/brands to application (NO AUTH CREATION)
    // ===================================================================
    
    if (selectedAccountType === 'agent') {
      toast({
        title: "Complete Your Application",
        description: "You'll be redirected to the agent application form.",
      });
      
      navigate('/apply/agent', {
        state: {
          email: normalizedEmail,
          firstName,
          lastName,
          phone,
          smsOptIn,
        }
      });
      setIsLoading(false);
      return;
    }

    if (selectedAccountType === 'brand') {
      toast({
        title: "Complete Your Application",
        description: "You'll be redirected to the brand application form.",
      });
      
      navigate('/brand/onboarding', {
        state: {
          email: normalizedEmail,
          firstName,
          lastName,
          phone,
          smsOptIn,
        }
      });
      setIsLoading(false);
      return;
    }
    
    // ===================================================================
    // ONLY create auth for travelers and creators
    // ===================================================================
    
    if (selectedAccountType !== 'traveler' && selectedAccountType !== 'creator') {
      toast({
        title: "Invalid account type",
        description: "Please select a valid account type.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      const errorMessage = passwordValidation.error.errors[0].message;
      toast({
        title: "Invalid password",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("[Auth] Signing up with email:", normalizedEmail);
      
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

        let description = error.message || "An unexpected error occurred.";
        if (error.message === "Failed to fetch" || error.message?.includes("fetch")) {
          description = "Unable to connect to authentication server. Please check your internet connection or contact support.";
        }

        toast({
          title: "Could not create your account",
          description,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setStep("verify-email");
      setIsLoading(false);
    } catch (error: any) {
      console.error("Unexpected signup error:", error);
      toast({
        title: "Sign up failed",
        description: error?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      persistRedirectTargetForOAuth();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setIsLoading(true);
      persistRedirectTargetForOAuth();
      const origin = encodeURIComponent(window.location.origin);
      const timestamp = Date.now();
      window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-signin-init?origin=${origin}&cb=${timestamp}`;
    } catch (error: any) {
      toast({
        title: "Facebook sign-in failed",
        description: error?.message || 'Failed to initiate Facebook Sign-In',
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleTikTokSignIn = async () => {
    try {
      setIsLoading(true);
      persistRedirectTargetForOAuth();
      const origin = encodeURIComponent(window.location.origin);
      const timestamp = Date.now();
      window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiktok-signin-init?origin=${origin}&cb=${timestamp}`;
    } catch (error: any) {
      toast({
        title: "TikTok sign-in failed",
        description: error?.message || 'Failed to initiate TikTok Sign-In',
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      persistRedirectTargetForOAuth();
      const origin = encodeURIComponent(window.location.origin);
      window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apple-signin-init?origin=${origin}&cb=${Date.now()}`;
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error?.message || 'Failed to initiate Apple Sign-In',
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke('request-password-reset', {
        body: {
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        },
      });

      if (error) throw error;

      toast({
        title: "Reset email sent",
        description: "Check your email for a password reset link from Goldsainte.",
      });
      setStep('email');
    } catch (error: any) {
      // Extract the actual error message from edge function response
      const errorMessage = 
        error?.context?.body?.error ||
        error?.message ||
        error?.error ||
        "Failed to send reset email.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
      }
      navigate(destination, { replace: true });
      return;
    }

    // Use centralized routing logic
    const postAuthDestination = getPostAuthDestination(
      profile?.account_type,
      profile?.onboarding_completed
    );
    navigate(postAuthDestination, { replace: true });
  };

  // Show loading state while auth is processing or redirecting
  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF9F0]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#C7A962]" />
          <p className="text-[#6B7280]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF9F0] p-4">
      <div className="w-full max-w-md bg-white border border-[#E5DFC6] rounded-3xl p-8 sm:p-10 shadow-lg">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logomark} alt="Goldsainte Logo" className="h-12 w-12" />
        </div>

        {/* Account Type Step - SHOWN FIRST */}
        {step === 'account-type' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-secondary text-[#0a2225] mb-2">
                Welcome to Goldsainte
              </h1>
              <p className="text-sm text-[#6B7280]">
                Choose your account type to get started
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  setSelectedAccountType('traveler');
                  setStep('email');
                }}
                className="p-5 rounded-2xl border-2 border-[#E5DFC6] hover:border-[#C7A962] hover:bg-[#FDF9F0]/50 transition-all text-left bg-white"
              >
                <div className="font-secondary text-base text-[#0a2225] mb-1">Traveler</div>
                <div className="text-sm text-[#6B7280]">
                  Book and plan luxury travel experiences
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedAccountType('creator');
                  setStep('email');
                }}
                className="p-5 rounded-2xl border-2 border-[#E5DFC6] hover:border-[#C7A962] hover:bg-[#FDF9F0]/50 transition-all text-left bg-white"
              >
                <div className="font-secondary text-base text-[#0a2225] mb-1">Creator</div>
                <div className="text-sm text-[#6B7280]">
                  Share travel content and inspire others
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedAccountType('agent');
                  setStep('email');
                }}
                className="p-5 rounded-2xl border-2 border-[#E5DFC6] hover:border-[#C7A962] hover:bg-[#FDF9F0]/50 transition-all text-left bg-white"
              >
                <div className="font-secondary text-base text-[#0a2225] mb-1">Travel Agent</div>
                <div className="text-sm text-[#6B7280]">
                  Professional agents • Application required
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedAccountType('brand');
                  setStep('email');
                }}
                className="p-5 rounded-2xl border-2 border-[#E5DFC6] hover:border-[#C7A962] hover:bg-[#FDF9F0]/50 transition-all text-left bg-white"
              >
                <div className="font-secondary text-base text-[#0a2225] mb-1">Brand/Hotel</div>
                <div className="text-sm text-[#6B7280]">
                  Hotels & lifestyle brands • Application required
                </div>
              </button>
            </div>
            
            {/* Sign in link for existing users */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  navigate('/auth', { replace: true });
                }}
                className="text-sm text-[#C7A962] hover:text-[#BFAD72] hover:underline font-medium"
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
              <h1 className="text-2xl sm:text-3xl font-secondary text-[#0a2225] mb-2">
                {isSignUpMode ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="text-sm text-[#6B7280]">
                {isSignUpMode 
                  ? 'Enter your email to get started with Goldsainte.'
                  : 'Sign in to plan fast, save big, and travel smarter — powered by AI, agents, and creators.'}
              </p>
            </div>
          <div className="space-y-4">
            {/* Social Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-white border-2 border-[#E5DFC6] hover:border-[#C7A962] hover:bg-[#FDF9F0]/50 text-[#0a2225]"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-white border-2 border-[#E5DFC6] hover:border-[#C7A962] hover:bg-[#FDF9F0]/50 text-[#0a2225]"
                onClick={handleFacebookSignIn}
                disabled={isLoading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-white border-2 border-[#E5DFC6] hover:border-[#C7A962] hover:bg-[#FDF9F0]/50 text-[#0a2225]"
                onClick={handleTikTokSignIn}
                disabled={isLoading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48" fill="none">
                  <path d="M34.6 8.9c-1.8-3.2-2.7-5.5-2.7-5.5h-7.3v28.9c0 1.8-.9 3.5-2.4 4.5-1.5 1-3.4 1.1-5 .4-1.6-.7-2.7-2.2-3-4-.3-1.8.3-3.6 1.6-4.9 1.3-1.3 3.1-1.8 4.8-1.4V19c-1.4-.3-2.8-.3-4.2 0-5.1 1.1-8.6 5.8-8.1 11.1.5 5.3 4.8 9.4 10 9.9 5.3.5 10-3.2 11.1-8.3.1-.5.2-1 .2-1.6V16.7c2.5 1.8 5.5 2.8 8.6 2.8v-7.2c-1.9.1-3.6-.5-5.1-1.5-1.5-1-2.6-2.4-3.5-4.9z" fill="url(#tiktok-gradient)"/>
                  <defs>
                    <linearGradient id="tiktok-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00F2EA"/>
                      <stop offset="100%" stopColor="#FF0050"/>
                    </linearGradient>
                  </defs>
                </svg>
                Continue with TikTok
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-white border-2 border-[#E5DFC6] hover:border-[#C7A962] hover:bg-[#FDF9F0]/50 text-[#0a2225]"
                onClick={handleAppleSignIn}
                disabled={isLoading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </Button>
            </div>

            {/* OR Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#E5DFC6]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[#6B7280]">OR</span>
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
                className="h-12 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleContinueWithEmail();
                  }
                }}
              />
              <Button 
                className="w-full h-12 rounded-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6]"
                onClick={handleContinueWithEmail}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>

            {/* Footer Links */}
            <div className="mt-6 space-y-2 text-center">
              {isSignUpMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    navigate('/auth', { replace: true });
                  }}
                  className="block w-full text-sm text-[#C7A962] hover:text-[#BFAD72] hover:underline font-medium"
                >
                  Already have an account? Sign in
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep('account-type')}
                  className="block w-full text-sm text-[#C7A962] hover:text-[#BFAD72] hover:underline font-medium"
                >
                  New to Goldsainte? Create an account
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="block w-full text-sm text-[#6B7280] hover:text-[#0a2225] transition-colors"
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
            <div className="text-sm text-[#6B7280] mb-4">
              Signing in as <span className="font-medium text-[#0a2225]">{email}</span>
              {' '}
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-[#C7A962] hover:text-[#BFAD72] hover:underline"
              >
                Change
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#0a2225]">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-[#6B7280] hover:text-[#0a2225] transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep('forgot-password')}
                className="text-[#C7A962] hover:text-[#BFAD72] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="mt-3 text-center text-sm text-[#6B7280]">
              <button
                type="button"
                onClick={() => setStep('signup')}
                className="hover:text-[#0a2225] hover:underline"
              >
                Need an account? Create one instead
              </button>
            </div>
          </form>
        )}

        {/* Sign Up Step */}
        {step === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-secondary text-[#0a2225] mb-2">
                {selectedAccountType === 'agent' && "Apply as Travel Agent"}
                {selectedAccountType === 'brand' && "Apply as Brand"}
                {selectedAccountType === 'traveler' && "Create Traveler Account"}
                {selectedAccountType === 'creator' && "Create Creator Account"}
              </h1>
              <p className="text-sm text-[#6B7280]">
                {(selectedAccountType === 'agent' || selectedAccountType === 'brand') 
                  ? "We'll redirect you to complete your application"
                  : "Enter your details to get started"
                }
              </p>
            </div>

            {/* Email field for all account types */}
            <div className="space-y-2">
              <Label htmlFor="signupEmail" className="text-sm font-medium text-[#0a2225]">Email address</Label>
              <Input
                id="signupEmail"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-[#0a2225]">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-[#0a2225]">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-[#0a2225]">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20"
              />
            </div>

            {/* SMS Opt-in Checkbox */}
            <div className="flex items-start space-x-3 pt-1">
              <Checkbox
                id="smsOptIn"
                checked={smsOptIn}
                onCheckedChange={(checked) => setSmsOptIn(checked === true)}
                disabled={isLoading}
                className="mt-0.5 h-4 w-4 border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
              />
              <div className="space-y-1">
                <Label 
                  htmlFor="smsOptIn" 
                  className="text-sm font-medium text-[#0a2225] leading-none cursor-pointer"
                >
                  Text message notifications
                </Label>
                <p className="text-sm text-[#6B7280]">
                  Receive trip updates, booking confirmations, and travel alerts via SMS. 
                  Message and data rates may apply.
                </p>
              </div>
            </div>

            {/* Only show password for traveler/creator */}
            {(selectedAccountType === 'traveler' || selectedAccountType === 'creator') && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#0a2225]">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20"
                  minLength={8}
                />
                <div className="text-sm text-[#6B7280] space-y-1">
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
                onClick={() => setStep('account-type')}
                className="flex-1 border-[#E5DFC6] hover:border-[#C7A962] hover:bg-[#FDF9F0]/50 text-[#0a2225]"
                disabled={isLoading}
              >
                Back
              </Button>
              
              <Button
                type="submit" 
                className="flex-1 h-12 rounded-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (selectedAccountType === 'agent' || selectedAccountType === 'brand') ? (
                  'Continue to Application'
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Verify Email Step */}
        {step === 'verify-email' && (
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-secondary text-[#0a2225] tracking-tight">
                Confirm your email
              </h2>
              <p className="text-sm text-[#6B7280] max-w-sm mx-auto">
                We've sent a confirmation link to{' '}
                <span className="font-medium text-[#0a2225]">{email}</span>
              </p>
              <p className="text-sm text-[#6B7280] max-w-md mx-auto mt-2">
                Please click the link in that email to verify your address and activate
                your Goldsainte account. Check your spam folder if you don't see it.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                type="button"
                className="w-full h-12 rounded-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6]"
                onClick={async () => {
                  if (!email) return;
                  setIsLoading(true);
                  try {
                    const { error } = await supabase.auth.resend({
                      type: "signup",
                      email,
                    });
                    if (error) {
                      toast({
                        title: "Could not resend email",
                        description: error.message,
                        variant: "destructive",
                      });
                    } else {
                      toast({
                        title: "Email sent",
                        description: "We've resent the confirmation email to your inbox.",
                      });
                    }
                  } catch (err: any) {
                    toast({
                      title: "Error",
                      description: err?.message || "Failed to resend email",
                      variant: "destructive",
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend confirmation email'
                )}
              </Button>
              
              <button
                type="button"
                onClick={() => setStep("email")}
                className="block w-full text-sm text-[#6B7280] hover:text-[#0a2225] transition-colors"
              >
                Use a different email
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-[#E5DFC6]">
              <p className="text-sm text-[#6B7280]">
                Once you verify your email, you'll be redirected back to complete your profile.
              </p>
            </div>
          </div>
        )}

        {/* Forgot Password Step */}
        {step === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-medium text-[#0a2225]">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20"
              />
              <p className="text-sm text-[#6B7280]">
                We'll send you a link to reset your password.
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep('signin')}
                className="text-sm text-[#6B7280] hover:text-[#0a2225] transition-colors"
              >
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
};

export default Auth;
