// Goldsainte Verified — the purchase / status card (IG-sheet structure, house style).
// Fully self-contained: fetches its own state, so any page can mount it with just a role.
//
// Three states:
//   1. Not subscribed        → preview (your name wearing the seal) + benefits + price + Get Verified
//   2. Paid, ID pending      → "one step left" → launches Stripe Identity
//   3. Paid + ID passed      → seal, renewal date, Manage subscription (Stripe portal)
//
// All money actions go through edge functions; prices shown here are labels only —
// the real price is resolved server-side from the user's role.
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { VerifiedSeal } from "@/components/verification/VerifiedSeal";
import { Loader2 } from "lucide-react";

type Role = "agent" | "creator" | "traveler";

const PRICE_LABEL: Record<Role, string> = {
  agent: "$8.99",
  creator: "$3.99",
  traveler: "$3.99",
};

interface ProfileState {
  verification_active: boolean;
  verification_period_end: string | null;
  stripe_verified_at: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export function GetVerifiedCard({ role }: { role: Role }) {
  const { t } = useTranslation();
  const [state, setState] = useState<ProfileState | null>(null);
  const [busy, setBusy] = useState<"" | "checkout" | "identity" | "portal">("");
  const [error, setError] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  const fetchState = useCallback(async (): Promise<ProfileState | null> => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("verification_active, verification_period_end, stripe_verified_at, full_name, avatar_url")
        .eq("id", auth.user.id)
        .single();
      if (data) setState(data as ProfileState);
      return (data as ProfileState) ?? null;
    } catch {
      return null; /* fail-open */
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Returning from Stripe with ?verification=success: the webhook may still be
  // in flight, so acknowledge the payment and poll briefly until the seal
  // state lands, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verification") !== "success") return;
    setFinalizing(true);
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      const fresh = await fetchState();
      if (fresh?.verification_active || attempts >= 8) {
        clearInterval(timer);
        setFinalizing(false);
        params.delete("verification");
        const qs = params.toString();
        window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
      }
    }, 1500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invoke = async (fn: string, kind: typeof busy) => {
    if (busy) return;
    setBusy(kind);
    setError(false);
    setErrorDetail(null);
    try {
      const { data, error } = await supabase.functions.invoke(fn, { body: {} });
      if (error) {
        // Pull the real message out of the edge function's error response so
        // setup problems (e.g. a missing price secret) are visible on sight.
        let detail = error.message ?? String(error);
        try {
          const body = await (error as any)?.context?.json?.();
          if (body?.error) detail = body.error;
        } catch { /* keep generic detail */ }
        console.error(`[GoldsainteVerified] ${fn} failed:`, detail, error);
        throw new Error(detail);
      }
      if (!data?.url) throw new Error("No redirect URL returned");
      window.location.href = data.url;
    } catch (e: any) {
      setError(true);
      setErrorDetail(typeof e?.message === "string" ? e.message : null);
      setBusy("");
    }
  };

  const name = state?.full_name || t("gv.you", "You");
  const subscribed = !!state?.verification_active;
  const idPassed = !!state?.stripe_verified_at;
  const fullyVerified = subscribed && idPassed;
  const renewDate = state?.verification_period_end
    ? new Date(state.verification_period_end).toLocaleDateString()
    : "";

  const goldBtn =
    "w-full rounded-full bg-[#C7A962] hover:bg-[#B89A52] text-[#0a2225] font-medium h-11 text-[14px] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2";
  const quietBtn =
    "w-full rounded-full border border-[#C7A962]/50 text-[#0c4d47] hover:bg-[#FDF9F0] h-11 text-[14px] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2";

  return (
    <section className="rounded-3xl border border-[#E5DFC6] bg-[#FDFBF7] p-6 md:p-8">
      <h2 className="font-secondary text-2xl text-[#0a2225] flex items-center gap-2">
        {t("gv.title", "Goldsainte Verified")} <VerifiedSeal size={20} />
      </h2>

      {/* ---- Preview: your name wearing the seal (the IG moment) ---- */}
      <div className="mt-5 flex items-center gap-3">
        {state?.avatar_url ? (
          <img src={state.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover border border-[#E5DFC6]" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-[#0c4d47]/10 border border-[#E5DFC6]" />
        )}
        <span className="text-[16px] font-medium text-[#0a2225] inline-flex items-center gap-1.5">
          {name} <VerifiedSeal size={16} />
        </span>
      </div>

      {finalizing && !subscribed ? (
        <p className="mt-4 text-[14px] text-[#0c4d47] inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("gv.finalizing", "Payment received — activating your seal\u2026")}
        </p>
      ) : fullyVerified ? (
        <>
          <p className="mt-4 text-[14px] text-[#0a2225]/80">
            {t("gv.activeLine", "Your gold seal is active everywhere on Goldsainte.")}
          </p>
          {renewDate && (
            <p className="mt-1 text-[13px] text-[#0a2225]/60">
              {t("gv.renews", { defaultValue: "Renews {{date}} · receipt emailed monthly", date: renewDate })}
            </p>
          )}
          <div className="mt-5">
            <button type="button" className={quietBtn} disabled={busy !== ""} onClick={() => invoke("create-portal-session", "portal")}>
              {busy === "portal" && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("gv.manage", "Manage subscription")}
            </button>
          </div>
        </>
      ) : subscribed && !idPassed ? (
        <>
          <p className="mt-4 text-[14px] text-[#0a2225]/80">
            {t("gv.oneStep", "One step left: confirm your identity to display your seal.")}
          </p>
          <p className="mt-1 text-[13px] text-[#0a2225]/60">
            {t("gv.idWhy", "Every seal on Goldsainte is backed by a real identity check — that's what makes it worth wearing.")}
          </p>
          <div className="mt-5 space-y-2.5">
            <button type="button" className={goldBtn} disabled={busy !== ""} onClick={() => invoke("create-identity-verification", "identity")}>
              {busy === "identity" && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("gv.confirmId", "Confirm my identity")}
            </button>
            <button type="button" className={quietBtn} disabled={busy !== ""} onClick={() => invoke("create-portal-session", "portal")}>
              {busy === "portal" && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("gv.manage", "Manage subscription")}
            </button>
          </div>
        </>
      ) : (
        <>
          <ul className="mt-5 space-y-2.5 text-[14px] text-[#0a2225]/85">
            <li className="flex gap-2.5">
              <VerifiedSeal size={15} className="mt-0.5" />
              {t("gv.b1", "The gold seal beside your name — on your profile, cards, proposals, and messages.")}
            </li>
            <li className="flex gap-2.5">
              <VerifiedSeal size={15} className="mt-0.5" />
              {t("gv.b2", "Backed by a real identity check, so travelers know the seal means something.")}
            </li>
            <li className="flex gap-2.5">
              <VerifiedSeal size={15} className="mt-0.5" />
              {t("gv.b3", "A receipt lands in your inbox at signup and after every monthly renewal.")}
            </li>
          </ul>
          <p className="mt-5 text-[15px] text-[#0a2225]">
            <span className="font-medium">{PRICE_LABEL[role]}</span>
            <span className="text-[#0a2225]/60">{t("gv.perMonth", "/month · cancel anytime")}</span>
          </p>
          <div className="mt-4">
            <button type="button" className={goldBtn} disabled={busy !== ""} onClick={() => invoke("create-verification-checkout", "checkout")}>
              {busy === "checkout" && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("gv.cta", "Get Verified")}
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="mt-3">
          <p className="text-[13px] text-red-700/80">
            {t("gv.error", "Something went wrong — please try again.")}
          </p>
          {errorDetail && (
            <p className="mt-1 text-[11.5px] font-mono text-red-700/60 break-words">{errorDetail}</p>
          )}
        </div>
      )}
    </section>
  );
}

export default GetVerifiedCard;
