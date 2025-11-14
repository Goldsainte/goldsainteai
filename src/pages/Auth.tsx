import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import logomark from '@/assets/logomark-gold.png';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

type AuthStep = 'email' | 'signin' | 'signup' | 'forgot-password';

const Auth = () => {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');
      if (returnTo && returnTo.startsWith('/')) {
        navigate(returnTo, { replace: true });
        return;
      }

      const checkAIAgent = async () => {
        try {
          const { data } = await supabase
            .from('ai_agent_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (data) {
            navigate('/', { replace: true });
          } else {
            navigate('/ai-agent-setup', { replace: true });
          }
        } catch (error) {
          console.error('Error checking AI agent profile:', error);
          navigate('/', { replace: true });
        }
      };
      checkAIAgent();
    }
  }, [user, authLoading, navigate]);

  const handleContinueWithEmail = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if user exists by attempting to sign in with a dummy password
      // This is a workaround since Supabase doesn't have a direct "check if email exists" endpoint
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy-password-check-12345',
      });

      // If error is "Invalid login credentials", the user exists
      if (error?.message.includes('Invalid login credentials')) {
        setStep('signin');
      } else if (error?.message.includes('Email not confirmed')) {
        setStep('signin');
      } else {
        // User doesn't exist, show signup
        setStep('signup');
      }
    } catch (error) {
      // Default to signup if check fails
      setStep('signup');
    }

    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
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
    
    const { error } = await signUp(email, password, '', firstName, lastName, phone);
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Let's create your personalized AI travel agent.",
      });
      navigate('/ai-agent-setup');
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
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

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
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
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  // Show loading state while auth is processing or redirecting
  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 sm:p-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logomark} alt="Goldsainte Logo" className="h-12 w-12" />
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">
            {isMobile ? 'Log in or sign up' : 'Welcome back'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sign in to plan fast, save big, and travel smarter — powered by AI, agents, and creators.
          </p>
        </div>

        {/* Email Step */}
        {step === 'email' && (
          <div className="space-y-4">
            {/* Social Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-card border-2"
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
                className="w-full h-12 bg-card border-2"
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
                className="w-full h-12 bg-card border-2"
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
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">OR</span>
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
                className="h-12"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleContinueWithEmail();
                  }
                }}
              />
              <Button 
                className="w-full h-12 bg-foreground text-background hover:bg-foreground/90"
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
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue without signing in
              </button>
            </div>
          </div>
        )}

        {/* Sign In Step */}
        {step === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-12"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90" 
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
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep('forgot-password')}
                className="text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </form>
        )}

        {/* Sign Up Step */}
        {step === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-12"
                minLength={8}
              />
              <div className="text-xs text-muted-foreground space-y-1">
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
            <Button 
              type="submit" 
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password Step */}
        {step === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                We'll send you a link to reset your password.
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90" 
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
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to sign in
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Auth;
