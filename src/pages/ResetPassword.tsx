import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2 } from 'lucide-react';
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setHasToken(true);
      }
    });

    // Fallback: if a session already exists (user landed here from email link
    // after Supabase auto-exchanged the code), allow them to set a new password.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasToken(true);
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
          navigate('/auth');
        }
        return prev;
      });
    }, 1500);

    return () => {
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

  if (!hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <Card className="w-full max-w-md p-6 sm:p-8 text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-secondary mb-2">Password Reset Successfully!</h1>
          <p className="text-muted-foreground mb-6">
            Redirecting you to sign in...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="flex flex-col items-center mb-8">
          <img src={logomark} alt="Logo" className="h-16 w-16 mb-4" loading="lazy"/>
          <h1 className="text-xl sm:text-2xl font-secondary text-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Reset Your Password
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Password must contain:</p>
            <ul className="list-disc list-inside pl-2 space-y-0.5">
              <li>At least 8 characters</li>
              <li>One uppercase letter (A-Z)</li>
              <li>One lowercase letter (a-z)</li>
              <li>One number (0-9)</li>
              <li>One special character (!@#$%^&*)</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting password...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/auth')}
            className="text-xs text-muted-foreground"
          >
            Back to sign in
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;
