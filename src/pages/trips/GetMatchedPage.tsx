/* GetMatchedPage v2 (31 Jul, same day as v1) — REAL matching, not intake.
 * v1 parsed the brief and silently created a plain trip request — founder
 * verdict, correctly: "another path to a trip request we already have."
 * v2 delivers the promise in the button: describe the trip, and the AI
 * SHOWS YOU THE MATCHED PEOPLE — ranked creators with a reason each,
 * on the spot. From each match, one click sends your trip DIRECTLY to that
 * person (preferred_creator_id + the same direct-request notification
 * PostTripPage sends). Posting to everyone remains a deliberate secondary
 * choice, not the hidden default. Route: /get-matched (RequireAuth). */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { edgeErrorMessage } from "@/lib/edgeErrorMessage";

interface Match {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  location: string | null;
  niches: string[];
  reason: string;
}

const EXAMPLES = [
  "Ten days in Japan in late October — two of us, love food and quiet temples, comfortable but not flashy, around $6k total.",
  "Anniversary trip somewhere warm in June, 5–6 nights, we want great beaches and one unforgettable dinner.",
  "Family of four (kids 8 and 11) to Costa Rica this summer — wildlife, zip lines, nothing too rugged.",
];

export default function GetMatchedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [brief, setBrief] = useState("");
  const [phase, setPhase] = useState<"brief" | "results">("brief");
  const [working, setWorking] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [fields, setFields] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  const runMatch = async () => {
    if (brief.trim().length < 15) {
      toast.error(t('trip.gmTellMore'));
      return;
    }
    setWorking(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-trip-brief", {
        body: { brief },
      });
      if (error) throw new Error(await edgeErrorMessage(error, "Matching failed"));
      if (data?.error) throw new Error(data.error);
      setFields(data.fields);
      setMatches(data.matches ?? []);
      setPhase("results");
    } catch (e: any) {
      toast.error(e.message || t('trip.gmWrong'));
    } finally {
      setWorking(false);
    }
  };

  /* Insert the trip request — identical shape to the wizard's — either
   * addressed to one matched creator (direct request + notification, the
   * exact contract PostTripPage uses) or open to everyone. */
  const createRequest = async (preferredCreatorId: string | null) => {
    setSendingTo(preferredCreatorId ?? "__all__");
    try {
      const payload: any = {
        user_id: user!.id,
        title: fields.title,
        destination: fields.destination,
        start_date: fields.start_date,
        end_date: fields.end_date,
        travelers_adults: fields.travelers_adults,
        travelers_children: fields.travelers_children,
        budget_min: fields.budget_min,
        budget_max: fields.budget_max,
        budget_level: fields.budget_level,
        occasion: fields.occasion,
        pace: fields.pace,
        interests: fields.interests,
        special_notes: [fields.special_notes, `— Original request, in the traveler's words: "${brief.trim()}"`]
          .filter(Boolean)
          .join("\n\n"),
        status: "open",
        source_metadata: { entry: "get-matched-ai", matched: matches.map((m) => m.id) },
      };
      if (preferredCreatorId) payload.preferred_creator_id = preferredCreatorId;

      const { data: inserted, error: insertError } = await supabase
        .from("trip_requests")
        .insert(payload)
        .select("id")
        .single();
      if (insertError) throw insertError;

      if (preferredCreatorId) {
        // Same notification contract as PostTripPage's direct requests —
        // type "booking" is the notify contract's first-class type.
        const { error: notifyError } = await supabase.functions.invoke("send-notification", {
          body: {
            userId: preferredCreatorId,
            title: "New Direct Trip Request",
            body: `You received a direct trip request${fields.destination ? ` for ${fields.destination}` : ""}`,
            type: "booking",
            priority: "high",
            actionUrl: `/marketplace/request/${inserted.id}`,
            entityType: "trip_request",
            entityId: inserted.id,
          },
        });
        if (notifyError) console.error("send-notification failed:", notifyError);
      }

      // Keep the background pipeline identical to every other entry point.
      void supabase.functions.invoke("ai-trip-matching", {
        body: { tripRequestId: inserted.id },
      });

      const to = matches.find((m) => m.id === preferredCreatorId);
      toast.success(
        preferredCreatorId ? t('trip.gmOnItsWay', { name: to?.name ?? t('trip.gmThem') }) : t('trip.gmPostedAll'),
        { description: t('trip.gmProposalsLand') },
      );
      navigate(`/trip-requests/${inserted.id}`, { replace: true });
    } catch (e: any) {
      toast.error(e.message || "Could not send — please try again.");
      setSendingTo(null);
    }
  };

  return (
    <div className="flex-1 bg-[#FDF9F0] text-[#0a2225]">
      {/* Entrance (31 Jul): frame-by-frame analysis of the founder's screen
          recording showed the "hard animation to the right" was actually a
          single-frame HARD CUT — full-width directory to sparse column in
          66ms, which the eye reads as violent motion. The fix is a deliberate
          entrance, not less motion: the site's existing fadeIn (250ms rise)
          makes the swap read as intent. Applies on both page phases. */}
      <div
        key={phase}
        className="mx-auto w-full max-w-3xl px-5 pb-24 pt-16 md:pt-20"
        style={{ animation: "fadeIn 0.25s ease-out" }}
      >
        {phase === "brief" ? (
          <>
            <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">{t('trip.gmKicker')}</p>
            <h1 className="mt-4 font-secondary text-[40px] leading-[1.08] md:text-[52px]">
              {t('trip.gmTitle')}
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[#0a2225]/55">
              {t('trip.gmIntro')}
              who fit, instantly.
            </p>

            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              disabled={working}
              rows={7}
              placeholder={EXAMPLES[Math.floor(Date.now() / 86400000) % EXAMPLES.length]}
              className="mt-8 w-full rounded-2xl border border-[#E5DFC6] bg-white p-5 text-[16px] leading-relaxed text-[#0a2225] outline-none transition-colors placeholder:text-[#0a2225]/30 focus:border-[#C7A962] disabled:opacity-60"
            />

            <div className="mt-6 flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={runMatch}
                disabled={working}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#0c4d47] px-9 py-3.5 text-[15px] text-[#E5DFC6] transition-colors hover:bg-[#073331] disabled:opacity-60"
              >
                {working ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Finding your matches…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> {t('trip.gmMatchMe')}
                  </>
                )}
              </button>
              <Link to="/post-trip" className="text-[14px] text-[#0c4d47] underline underline-offset-4">
                {t('trip.gmGuided')}
              </Link>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => { setPhase("brief"); setSendingTo(null); }}
              className="inline-flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#0a2225]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Edit my trip
            </button>

            <p className="mt-6 text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">{t('trip.gmYourMatches')}</p>
            <h1 className="mt-3 font-secondary text-[34px] leading-tight md:text-[44px]">
              {matches.length > 0
                ? t('trip.gmFitCount', { count: matches.length })
                : t('trip.gmNoFits')}
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#0a2225]/55">
              {fields?.title ? `${fields.title}` : t('trip.gmYourTrip')}
              {fields?.destination ? ` · ${fields.destination}` : ""}
              {fields?.occasion ? ` · ${fields.occasion}` : ""}
            </p>

            {matches.length > 0 ? (
              <div className="mt-10 space-y-0 border-t border-[#0a2225]/10">
                {matches.map((m) => (
                  <div key={m.id} className="flex flex-col gap-4 border-b border-[#0a2225]/10 py-7 md:flex-row md:items-center">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={m.name} className="h-16 w-16 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#0c4d47] font-secondary text-xl text-[#E5DFC6]">
                        {m.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <p className="font-secondary text-xl text-[#0a2225]">{m.name}</p>
                        {m.location && <p className="text-[13px] text-[#6B7280]">{m.location}</p>}
                      </div>
                      {m.niches.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {m.niches.map((n) => (
                            <span key={n} className="rounded-full border border-[#E5DFC6] bg-[#f7f3ea] px-2.5 py-0.5 text-[11px] text-[#0a2225]/70">
                              {n}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 font-secondary text-[15px] italic leading-relaxed text-[#0a2225]/70">
                        {m.reason}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <Link to={`/creators/${m.id}`} className="text-[13px] text-[#0c4d47] underline underline-offset-4">
                        {t('trip.gmViewProfile')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => createRequest(m.id)}
                        disabled={sendingTo !== null}
                        className="rounded-full bg-[#0c4d47] px-6 py-2.5 text-sm text-[#E5DFC6] transition-colors hover:bg-[#073331] disabled:opacity-50"
                      >
                        {sendingTo === m.id ? t('trip.gmSending') : t('trip.gmSendThem')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-[#0a2225]/70">
                None of our current creators are a confident fit for this exact
                trip — rather than pretend otherwise, you can open it to
                everyone and let specialists come to you.
              </p>
            )}

            <div className="mt-10">
              <button
                type="button"
                onClick={() => createRequest(null)}
                disabled={sendingTo !== null}
                className={
                  matches.length > 0
                    ? "text-[14px] text-[#0c4d47] underline underline-offset-4 disabled:opacity-50"
                    : "rounded-full bg-[#0c4d47] px-9 py-3.5 text-[15px] text-[#E5DFC6] transition-colors hover:bg-[#073331] disabled:opacity-50"
                }
              >
                {sendingTo === "__all__"
                  ? t('trip.gmPosting')
                  : matches.length > 0
                  ? t('trip.gmPostAllInstead')
                  : t('trip.gmPostAll')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
