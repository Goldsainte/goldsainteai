import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding/profile`,
          },
        });

        if (error) throw error;

        if (data.user && data.session) {
          navigate("/onboarding/profile", { replace: true });
        } else {
          setInfo(
            "Check your email to verify your address. Once verified, you'll be taken to your Goldsainte onboarding."
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (!data.session) {
          throw new Error("Could not start a session.");
        }

        navigate(redirect || "/onboarding/profile", { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setError(null);
    setInfo(null);
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/onboarding/profile?from=oauth`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "OAuth sign-in failed.");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a2225] via-[#0a2225] to-[#E5DFC6] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-black/60 border border-[#BFAD72]/40 px-5 py-6 text-[#E5DFC6] space-y-5 shadow-lg">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 text-[11px] text-[#BFAD72] font-semibold">
            <Sparkles className="h-3 w-3" />
            Goldsainte membership
          </div>
          <h1 className="text-lg font-semibold">
            {mode === "signin" ? "Welcome back" : "Create your Goldsainte account"}
          </h1>
          <p className="text-[11px] text-[#E5DFC6]/80">
            Sign in to manage trips, or create a new account to join as a traveler,
            TikTok creator, or travel agent.
          </p>
        </header>

        <div className="inline-flex rounded-full bg-black/40 border border-[#E5DFC6]/30 p-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 px-3 py-1 rounded-full ${
              mode === "signin"
                ? "bg-[#BFAD72] text-[#0a2225] font-semibold"
                : "text-[#E5DFC6]/80"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 px-3 py-1 rounded-full ${
              mode === "signup"
                ? "bg-[#BFAD72] text-[#0a2225] font-semibold"
                : "text-[#E5DFC6]/80"
            }`}
          >
            Create account
          </button>
        </div>

        <div className="space-y-2 text-[11px]">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleOAuth("google")}
            className="w-full rounded-full bg-white text-[#0a2225] px-3 py-2 font-semibold flex items-center justify-center gap-2 hover:bg-zinc-100 disabled:opacity-50"
          >
            <span>Continue with Google</span>
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleOAuth("apple")}
            className="w-full rounded-full bg-black text-[#E5DFC6] px-3 py-2 font-semibold flex items-center justify-center gap-2 border border-[#E5DFC6]/20 hover:bg-black/80 disabled:opacity-50"
          >
            <span>Continue with Apple</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-[#E5DFC6]/70">
          <div className="h-px flex-1 bg-[#E5DFC6]/30" />
          <span>or use email</span>
          <div className="h-px flex-1 bg-[#E5DFC6]/30" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
          <label className="block space-y-1">
            <span>Email</span>
            <div className="flex items-center gap-2 rounded-2xl bg-black/50 border border-[#E5DFC6]/30 px-3 py-2">
              <Mail className="h-3 w-3 text-[#BFAD72]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[11px]"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block space-y-1">
            <span>Password</span>
            <div className="flex items-center gap-2 rounded-2xl bg-black/50 border border-[#E5DFC6]/30 px-3 py-2">
              <Lock className="h-3 w-3 text-[#BFAD72]" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[11px]"
                placeholder="At least 8 characters"
              />
            </div>
          </label>

          {error && (
            <p className="text-[11px] text-red-300 bg-red-950/40 border border-red-500/40 rounded-2xl px-3 py-2">
              {error}
            </p>
          )}
          {info && (
            <p className="text-[11px] text-[#BFAD72] bg-black/40 border border-[#BFAD72]/40 rounded-2xl px-3 py-2">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#BFAD72] text-[#0a2225] px-3 py-2 text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-[#d4c58d] disabled:opacity-50"
          >
            {submitting
              ? mode === "signup"
                ? "Creating your account…"
                : "Signing you in…"
              : mode === "signup"
              ? "Create account"
              : "Sign in"}
            <ArrowRight className="h-3 w-3" />
          </button>

          {mode === "signin" && (
            <p className="text-[10px] text-[#E5DFC6]/70">
              New to Goldsainte?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="underline"
              >
                Create an account
              </button>
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
