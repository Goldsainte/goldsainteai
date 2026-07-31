/* GetMatchedPage (31 Jul) — the AI front door for matching. One generous
 * text box instead of the multi-step wizard: the parse-trip-brief function
 * extracts the same structured fields the wizard produces, the trip request
 * is inserted through the same client path, and the EXISTING ai-trip-matching
 * pipeline fires downstream unchanged (same fire-and-forget the
 * TripRequestModal uses). The wizard remains one link away for people who
 * prefer step-by-step. Route: /get-matched (RequireAuth, like /post-trip). */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { edgeErrorMessage } from "@/lib/edgeErrorMessage";

const EXAMPLES = [
  "Ten days in Japan in late October — two of us, love food and quiet temples, comfortable but not flashy, around $6k total.",
  "Anniversary trip somewhere warm in February, 5–6 nights, we want great beaches and one unforgettable dinner.",
  "Family of four (kids 8 and 11) to Costa Rica this summer — wildlife, zip lines, nothing too rugged.",
];

export default function GetMatchedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [brief, setBrief] = useState("");
  const [working, setWorking] = useState(false);

  const submit = async () => {
    if (brief.trim().length < 15) {
      toast.error("Tell us a little more about the trip first.");
      return;
    }
    setWorking(true);
    try {
      // 1. AI extracts the wizard's fields from the traveler's own words.
      const { data, error } = await supabase.functions.invoke("parse-trip-brief", {
        body: { brief },
      });
      if (error) throw new Error(await edgeErrorMessage(error, "Could not read the brief"));
      if (data?.error) throw new Error(data.error);
      const f = data.fields;

      // 2. Insert through the same client path the wizard uses — identical
      //    shape, status "open", the traveler's words preserved in notes.
      const { data: inserted, error: insertError } = await supabase
        .from("trip_requests")
        .insert({
          user_id: user!.id,
          title: f.title,
          destination: f.destination,
          start_date: f.start_date,
          end_date: f.end_date,
          travelers_adults: f.travelers_adults,
          travelers_children: f.travelers_children,
          budget_min: f.budget_min,
          budget_max: f.budget_max,
          budget_level: f.budget_level,
          occasion: f.occasion,
          pace: f.pace,
          interests: f.interests,
          special_notes: [f.special_notes, `— Original request, in the traveler's words: "${brief.trim()}"`]
            .filter(Boolean)
            .join("\n\n"),
          status: "open",
          source_metadata: { entry: "get-matched-ai" },
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      // 3. Fire the existing matcher — identical to TripRequestModal.
      void supabase.functions.invoke("ai-trip-matching", {
        body: { tripRequestId: inserted.id },
      });

      toast.success("We're on it", {
        description: "Matching you with creators who fit your trip — proposals land right here.",
      });
      navigate(`/trip-requests/${inserted.id}`, { replace: true });
    } catch (e: any) {
      toast.error(e.message || "Something went wrong — please try again.");
      setWorking(false);
    }
  };

  return (
    <div className="flex-1 bg-[#FDF9F0] text-[#0a2225]">
      <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-16 md:pt-20">
        <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">Get matched</p>
        <h1 className="mt-4 font-secondary text-[40px] leading-[1.08] md:text-[52px]">
          Tell us about the trip.
        </h1>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[#0a2225]/55">
          In your own words — where you're dreaming of, who's coming, when, and
          what matters most. Our AI reads it, and we match you with the creators
          who fit.
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
            onClick={submit}
            disabled={working}
            className="inline-flex items-center gap-2.5 rounded-full bg-[#0c4d47] px-9 py-3.5 text-[15px] text-[#E5DFC6] transition-colors hover:bg-[#073331] disabled:opacity-60"
          >
            {working ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Reading your trip…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Match me
              </>
            )}
          </button>
          <Link to="/post-trip" className="text-[14px] text-[#0c4d47] underline underline-offset-4">
            Prefer step-by-step? Use the guided form
          </Link>
        </div>

        <p className="mt-10 max-w-xl text-[13px] leading-relaxed text-[#0a2225]/45">
          Your request is posted to the marketplace exactly as if you'd used the
          form — creators respond with tailored proposals, and everything stays
          on platform.
        </p>
      </div>
    </div>
  );
}
