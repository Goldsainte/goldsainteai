import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MailCheck } from "lucide-react";
import { isDuplicateEmailError, isDuplicateEmailSignupResponse } from "@/lib/auth/duplicateEmail";
import { useAuth } from "@/contexts/AuthContext";

const inputClasses =
  "min-h-[48px] w-full border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg";

export default function AgentSignup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const unverified = searchParams.get("unverified") === "1";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  // After successful signup OR if user landed here unverified, show check-email screen.
  const [checkEmailFor, setCheckEmailFor] = useState<string | null>(
    unverified && user?.email && !user.email_confirmed_at ? user.email : null,
  );

  // If a verified, signed-in user reaches this page, send them straight into
  // the app — but NOT while we're sitting on the just-submitted check-email
  // panel (otherwise an auto-confirmed session would skip verification UX).
  useEffect(() => {
    if (checkEmailFor) return;
    if (user?.email_confirmed_at) {
      navigate("/apply/agent", { replace: true });
    }
  }, [user, navigate, checkEmailFor]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: "Please enter your first and last name", variant: "destructive" });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "Please enter your phone number", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (password !== passwordConfirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (!acceptedTerms) {
      toast({ title: "Please accept the Terms of Service to continue", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/apply/agent?verified=1`,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            account_type: "agent",
            intended_flow: "agent_application",
          },
        },
      });
      if (error) {
        if (isDuplicateEmailError(error)) {
          toast({
            title: "Account already exists",
            description:
              "An account with this email already exists. Please sign in to resume your application.",
            variant: "destructive",
          });
          navigate(`/auth?returnTo=${encodeURIComponent("/apply/agent")}`);
          return;
        }
        throw error;
      }
      if (isDuplicateEmailSignupResponse(data)) {
        toast({
          title: "Account already exists",
          description: "Please sign in to resume your application.",
          variant: "destructive",
        });
        navigate(`/auth?returnTo=${encodeURIComponent("/apply/agent")}`);
        return;
      }

      // Defensive: if the project ever has auto-confirm enabled, signUp will
      // return a fully authenticated session. We never want to silently skip
      // the email-confirmation step, so sign them straight back out before
      // showing the check-email panel.
      if (data?.session || data?.user?.email_confirmed_at) {
        try {
          await supabase.auth.signOut();
        } catch {
          // best-effort; we still show the check-email panel below
        }
      }

      setCheckEmailFor(email.trim().toLowerCase());
    } catch (err: any) {
      console.error("Agent signup failed:", err);
      toast({
        title: "Could not create your account",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!checkEmailFor) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: checkEmailFor,
        options: {
          emailRedirectTo: `${window.location.origin}/apply/agent?verified=1`,
        },
      });
      if (error) throw error;
      toast({
        title: "Confirmation email re-sent",
        description: `We sent another link to ${checkEmailFor}.`,
      });
    } catch (err: any) {
      toast({
        title: "Could not resend",
        description: err?.message || "Please try again in a minute.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  if (checkEmailFor) {
    return (
      <div className="min-h-screen bg-[#FDF9F0] px-4 py-16">
        <div className="mx-auto max-w-xl">
          <Card className="bg-white border border-[#E5DFC6] rounded-2xl">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#FDF9F0] border border-[#C7A962]/30">
                <MailCheck className="h-8 w-8 text-[#C7A962]" />
              </div>
              <h1 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-3">
                Confirm your email
              </h1>
              <p className="text-[#6B7280] mb-2">
                We sent a confirmation link to
              </p>
              <p className="font-medium text-[#0a2225] mb-6 break-all">{checkEmailFor}</p>
              <p className="text-sm text-[#6B7280] mb-8">
                Click the link to verify your email. You'll be brought right back here to
                start your advisor application — no need to re-enter your details.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleResend}
                  disabled={resending}
                  variant="outline"
                  className="rounded-full border-[#0c4d47] text-[#0c4d47] hover:bg-[#0c4d47]/5"
                >
                  {resending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resending…</>
                  ) : (
                    "Resend confirmation email"
                  )}
                </Button>
                <p className="text-xs text-[#9A9079]">
                  Wrong address?{" "}
                  <button
                    type="button"
                    className="underline hover:text-[#0a2225]"
                    onClick={() => setCheckEmailFor(null)}
                  >
                    Start over
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225] mb-3">
            Create your <em>Goldsainte</em> advisor account
          </h1>
          <p className="text-[#6B7280] max-w-lg mx-auto">
            First, set up your account and verify your email. Then we'll take you straight
            into the advisor application with your details already filled in.
          </p>
        </div>

        <Card className="bg-white border border-[#E5DFC6] rounded-2xl">
          <CardContent className="p-6 md:p-10">
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-[#0a2225]">First name *</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClasses}
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#0a2225]">Last name *</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClasses}
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                  autoComplete="email"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Phone *</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClasses}
                  autoComplete="tel"
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-[#0a2225]">Password *</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClasses}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#0a2225]">Confirm password *</Label>
                  <Input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className={inputClasses}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <label className="flex items-start gap-3 text-sm text-[#0a2225] cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I agree to the{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#C7A962] hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy-cookies" target="_blank" rel="noopener noreferrer" className="text-[#C7A962] hover:underline">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full min-h-[52px] text-base"
              >
                {submitting ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating account…</>
                ) : (
                  "Create account & send confirmation"
                )}
              </Button>
              <p className="text-center text-xs text-[#9A9079]">
                Already have an account?{" "}
                <a
                  href={`/auth?returnTo=${encodeURIComponent("/apply/agent")}`}
                  className="underline hover:text-[#0a2225]"
                >
                  Sign in
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}