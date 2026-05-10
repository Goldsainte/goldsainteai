import { useTripMatches } from "@/hooks/useTripMatches";
import { Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";

export function TripAIMatches({ tripId }: { tripId: string }) {
  const { matches, loading, error } = useTripMatches(tripId);

  if (loading) {
    return (
      <div className="rounded-3xl border border-[#BFAD72]/40 bg-white p-4 text-xs text-[#6B7280]">
        Goldsainte AI is curating your travel partners…
      </div>
    );
  }

  if (error || matches.length === 0) {
    return (
      <div className="rounded-3xl border border-[#E5DFC6] bg-[#F5F0E8] p-5 text-xs text-[#0a2225]">
        <p className="font-secondary text-base text-[#0a2225] mb-1">Match with a specialist</p>
        <p className="text-[#6B7280] mb-3">Describe your ideal trip and our AI matches you with certified travel specialists who've been there.</p>
        <Link to="/post-trip" className="inline-flex rounded-full bg-[#0c4d47] text-white px-4 py-2 text-xs hover:bg-[#073331]">Post a trip request →</Link>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-[#BFAD72]/40 bg-white p-4 text-xs text-[#0a2225] space-y-3">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#BFAD72]" />
          <div>
            <h2 className="text-sm font-semibold">Goldsainte AI matches</h2>
            <p className="text-[11px] text-[#6B7280]">
              Creators & travel agents who are a natural fit for this trip.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-2 md:grid-cols-2">
        {matches.map((m) => (
          <div
            key={m.provider_id}
            className="rounded-2xl bg-[#F5F0E8] border border-[#E5DFC6] p-3 space-y-1"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold">
                  {m.full_name || "Goldsainte partner"}
                </p>
                <p className="text-[10px] text-[#6B7280]">
                  {m.provider_type === "creator" ? "TikTok Creator" : "Travel Agent"}
                </p>
              </div>
              {m.tiktok_followers && m.tiktok_followers > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] text-[#6B7280]">
                  <Users className="h-3 w-3" />
                  {Intl.NumberFormat("en", {
                    notation: "compact",
                  }).format(m.tiktok_followers)}{" "}
                  followers
                </span>
              )}
            </div>
            {m.tiktok_handle && (
              <p className="text-[10px] text-[#BFAD72]">
                @{m.tiktok_handle}
              </p>
            )}
            {m.bio && (
              <p className="text-[10px] text-[#6B7280] line-clamp-2">
                {m.bio}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
