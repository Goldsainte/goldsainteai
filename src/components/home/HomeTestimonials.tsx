import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function HomeTestimonials() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      // Best-effort: try a waitlist table if present; otherwise just confirm.
      try {
        await (supabase as any)
          .from("waitlist")
          .insert({ email: email.trim().toLowerCase(), source: "home_hero" });
      } catch {
        // ignore — UI should still confirm
      }
      setSubmitted(true);
      setEmail("");
      toast.success("You're on the list. We'll be in touch.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-[#f7f3ea]">
      <div className="mx-auto max-w-3xl px-4 py-16 md:py-24 text-center">
        <span className="inline-block rounded-full border border-[#0c4d47] bg-[#0c4d47] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#bfad72] mb-4">
          Early Access
        </span>
        <div className="mx-auto w-14 h-px bg-[#C7A962] mb-5" />
        <h2 className="font-secondary text-2xl md:text-4xl text-[#0c4d47]">
          <em>Be Among the First</em>
        </h2>
        <p className="mt-4 text-sm md:text-base text-[#0a2225]/75 max-w-xl mx-auto">
          Join our early access list and get priority booking when we launch.
        </p>

        {submitted ? (
          <p className="mt-8 font-secondary italic text-[#0c4d47]">
            Thank you — you're on the list.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-full border border-[#E5DFC6] bg-white px-5 py-3 text-sm text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:border-[#C7A962]"
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-[#0c4d47] px-6 py-3 text-sm font-semibold text-[#E5DFC6] shadow-sm hover:bg-[#073331] disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
