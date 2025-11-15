import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import logomark from '@/assets/logomark-gold.png';

export default function EmailConfirmedPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function handleConfirmation() {
      setStatus("checking");

      try {
        // Get the current user session
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (cancelled) return;

        if (userError || !user) {
          setStatus("error");
          setMessage(
            "We couldn't verify your email. The link may have expired. Please try signing in again."
          );
          return;
        }

        // Check if email is verified
        if (!user.email_confirmed_at) {
          setStatus("error");
          setMessage(
            "Your email hasn't been verified yet. Please check your inbox for the confirmation link."
          );
          return;
        }

        // Success! Try to send welcome email (non-blocking)
        try {
          await supabase.functions.invoke("welcome-email", {
            body: {
              email: user.email,
              firstName: user.user_metadata?.first_name || null,
            },
          });
        } catch (emailErr) {
          // Don't fail the whole flow if welcome email fails
          console.warn("Welcome email invocation failed:", emailErr);
        }

        setStatus("success");
        setMessage("Your email is verified and your account is ready to use!");

        // Auto-redirect after 2 seconds
        setTimeout(() => {
          if (!cancelled) {
            navigate("/auth", { replace: true });
          }
        }, 2000);
      } catch (err: any) {
        if (!cancelled) {
          console.error("Email confirmation error:", err);
          setStatus("error");
          setMessage(
            err?.message || "An unexpected error occurred. Please try signing in."
          );
        }
      }
    }

    handleConfirmation();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={logomark} alt="Goldsainte" className="h-16 w-auto" />
        </div>

        {/* Status Card */}
        <div className="rounded-3xl border border-border/40 bg-card p-8 text-center space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            {status === "checking" && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {status === "checking" && "Verifying your email..."}
              {status === "success" && "Email confirmed!"}
              {status === "error" && "Verification failed"}
            </h1>
            
            {/* Message */}
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {message || "Please wait while we verify your email address."}
            </p>
          </div>

          {/* Action Buttons */}
          {status === "success" && (
            <Button
              type="button"
              className="w-full h-12 rounded-full"
              onClick={() => navigate("/auth", { replace: true })}
            >
              Continue to Goldsainte
            </Button>
          )}

          {status === "error" && (
            <Button
              type="button"
              className="w-full h-12 rounded-full"
              onClick={() => navigate("/auth", { replace: true })}
            >
              Go to sign in
            </Button>
          )}

          {status === "checking" && (
            <p className="text-xs text-muted-foreground">
              This should only take a moment...
            </p>
          )}
        </div>

        {/* Footer Note */}
        {status === "success" && (
          <p className="text-xs text-muted-foreground text-center">
            You'll be redirected automatically, or click the button above to continue.
          </p>
        )}
      </div>
    </main>
  );
}
