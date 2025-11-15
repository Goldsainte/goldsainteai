import { useTripMatches } from "@/hooks/useTripMatches";
import { Sparkles, Users } from "lucide-react";

export function TripAIMatches({ tripId }: { tripId: string }) {
  const { matches, loading, error } = useTripMatches(tripId);

  if (loading) {
    return (
      <div className="rounded-3xl border border-[#BFAD72]/40 bg-black/40 p-4 text-xs text-[#E5DFC6]/80">
        Goldsainte AI is curating your travel partners…
      </div>
    );
  }

  if (error || matches.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#E5DFC6]/30 bg-black/20 p-4 text-xs text-[#E5DFC6]/70">
        Goldsainte AI is still learning your preferences. Post a few more trips
        and connect your TikTok to see curated creator and agent matches here.
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-[#BFAD72]/40 bg-black/40 p-4 text-xs text-[#E5DFC6] space-y-3">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#BFAD72]" />
          <div>
            <h2 className="text-sm font-semibold">Goldsainte AI matches</h2>
            <p className="text-[11px] text-[#E5DFC6]/80">
              Creators & travel agents who are a natural fit for this trip.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-2 md:grid-cols-2">
        {matches.map((m) => (
          <div
            key={m.provider_id}
            className="rounded-2xl bg-[#0a2225]/60 border border-[#E5DFC6]/20 p-3 space-y-1"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold">
                  {m.full_name || "Goldsainte partner"}
                </p>
                <p className="text-[10px] text-[#E5DFC6]/70">
                  {m.provider_type === "creator" ? "TikTok Creator" : "Travel Agent"}
                </p>
              </div>
              {m.tiktok_followers && m.tiktok_followers > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[9px] text-[#E5DFC6]/75">
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
              <p className="text-[10px] text-[#E5DFC6]/80 line-clamp-2">
                {m.bio}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
