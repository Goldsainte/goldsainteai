import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logomark from '@/assets/logomark-gold.png';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase's new PKCE recovery flow fires a PASSWORD_RECOVERY auth event
    // after exchanging the code in the URL. The legacy implicit flow sets
    // `#type=recovery` in the hash. Accept either, plus any active session
    // (the /verify endpoint logs the user in before redirecting here).
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    const hasHashRecovery = hashParams.get('type') === 'recovery';
    const hasQueryRecovery = queryParams.get('type') === 'recovery';
    const hasCodeParam = !!queryParams.get('code') || !!queryParams.get('token_hash');

    if (hasHashRecovery || hasQueryRecovery || hasCodeParam) {
      setHasToken(true);
    }

    const tokenHash = queryParams.get('token_hash') || hashParams.get('token_hash');
    const recoveryType = queryParams.get('type') || hashParams.get('type');
    let isMounted = true;

    const ensureRecoverySession = async () => {
      try {
        if (tokenHash && recoveryType === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (error) throw error;

          if (isMounted) {
            setHasToken(true);
            setIsVerifying(false);
          }
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (data.session && isMounted) {
          setHasToken(true);
          setIsVerifying(false);
          return;
        }

        if (isMounted && (hasHashRecovery || hasQueryRecovery || hasCodeParam)) {
          setIsVerifying(false);
        }
      } catch (error) {
        console.error('Recovery token verification failed:', error);
        if (!isMounted) return;
        setIsVerifying(false);
        setHasToken(false);
        toast({
          title: 'Invalid link',
          description: 'This password reset link is invalid or has expired.',
          variant: 'destructive',
        });
        navigate('/auth', { replace: true });
      }
    };

    void ensureRecoverySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setHasToken(true);
      }
    });

    // Fallback: if a session already exists (user landed here from email link
    // after Supabase auto-exchanged the code), allow them to set a new password.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setHasToken(true);
        setIsVerifying(false);
      }
    });

    // Only bounce to /auth if after a short grace period nothing surfaced.
    const timeout = setTimeout(() => {
      setHasToken((prev) => {
        if (!prev) {
          toast({
            title: "Invalid link",
            description: "This password reset link is invalid or has expired.",
            variant: "destructive",
          });
          setIsVerifying(false);
          navigate('/auth');
        }
        return prev;
      });
    }, 1500);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate password strength
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
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Password updated!",
        description: "Your password has been successfully reset.",
      });

      // Redirect to auth page after 2 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  if (isVerifying || !hasToken) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-20 bg-primary" />
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-start justify-center px-4 py-8 sm:px-6 sm:py-12">
          <div className="w-full max-w-xl rounded-[28px] border border-border/70 bg-card p-10 text-center shadow-xl">
            <img src={logomark} alt="Goldsainte" className="mx-auto mb-6 h-16 w-16" loading="lazy" />
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
            <h1 className="mb-3 font-secondary text-3xl text-foreground">Validating reset link</h1>
            <p className="mx-auto text-muted-foreground">Please wait while we securely prepare your password reset session.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-20 bg-primary" />
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-start justify-center px-4 py-8 sm:px-6 sm:py-12">
          <Card className="w-full max-w-xl rounded-[28px] border border-border/70 bg-card p-10 text-center shadow-xl">
            <CheckCircle2 className="mx-auto mb-5 h-16 w-16 text-primary" />
            <h1 className="mb-3 font-secondary text-3xl text-foreground">Password updated</h1>
            <p className="mx-auto mb-6 text-muted-foreground">
            Redirecting you to sign in...
          </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-20 bg-primary" />
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-start justify-center px-4 py-8 sm:px-6 sm:py-12">
        <Card className="w-full max-w-xl rounded-[28px] border border-border/70 bg-card p-8 shadow-xl sm:p-10">
          <div className="mb-10 flex flex-col items-center text-center">
            <img src={logomark} alt="Goldsainte" className="mb-5 h-16 w-16" loading="lazy" />
            <h1 className="font-secondary text-4xl text-foreground">Reset your password</h1>
            <p className="mt-3 text-base text-muted-foreground">Enter a new password for your Goldsainte account.</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-sm uppercase tracking-[0.18em] text-muted-foreground">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
                className="h-14 rounded-2xl border-border/80 bg-background px-5 text-base"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="confirm-password" className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
                className="h-14 rounded-2xl border-border/80 bg-background px-5 text-base"
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
              <p className="mb-3 text-sm uppercase tracking-[0.18em] text-muted-foreground">Password requirements</p>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character</li>
              </ul>
            </div>

            <Button type="submit" className="h-14 w-full rounded-2xl text-base" disabled={isLoading || isVerifying}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                'Save new password'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth')}
              className="mx-auto inline-flex items-center gap-2 rounded-full px-4 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
