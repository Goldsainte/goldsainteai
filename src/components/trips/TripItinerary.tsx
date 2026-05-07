import { Sparkles } from "lucide-react";

interface ItineraryDay {
  id: string;
  day_number: number;
  title: string;
  description: string | null;
  activities: unknown;
  meals_included: string[] | null;
  accommodation: string | null;
  is_featured_day: boolean | null;
}

interface TripItineraryProps {
  itinerary: ItineraryDay[];
}

export function TripItinerary({ itinerary }: TripItineraryProps) {
  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 md:p-8">
      <p className="font-secondary text-[11px] uppercase tracking-widest text-[#C7B892]">
        The Journey
      </p>
      <h2 className="mt-1 font-secondary text-2xl text-[#0a2225]">Day by day</h2>

      <div className="relative mt-8">
        {/* Gold timeline rail */}
        <div className="pointer-events-none absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-[#C7B892]/0 via-[#C7B892] to-[#C7B892]/0 md:left-4" />

        <div className="space-y-10">
          {itinerary.map((day) => {
            const acts = Array.isArray(day.activities)
              ? (day.activities as any[])
                  .map((a) => (typeof a === "string" ? a : a?.name || a?.title))
                  .filter(Boolean)
              : [];
            return (
              <article key={day.id} className="relative pl-10 md:pl-14">
                <span className="absolute left-1.5 top-1.5 flex h-3 w-3 items-center justify-center rounded-full border border-[#C7B892] bg-[#FDF9F0] md:left-2.5">
                  <span className="h-1 w-1 rounded-full bg-[#C7B892]" />
                </span>
                <p className="font-secondary text-[11px] uppercase tracking-widest text-[#C7B892]">
                  Day {String(day.day_number).padStart(2, "0")}
                </p>
                <h3 className="mt-1 flex items-center gap-2 font-secondary text-[20px] leading-tight text-[#0a2225]">
                  {day.title}
                  {day.is_featured_day && <Sparkles className="h-4 w-4 text-[#C7B892]" />}
                </h3>
                {day.description && (
                  <p className="mt-3 max-w-prose text-[14px] leading-relaxed text-[#4a4a4a]">
                    {day.description}
                  </p>
                )}

                {(acts.length > 0 ||
                  day.accommodation ||
                  (day.meals_included && day.meals_included.length > 0)) && (
                  <div className="mt-4 grid gap-4 border-t border-[#E5DFC6]/60 pt-4 md:grid-cols-2">
                    {acts.length > 0 && (
                      <div>
                        <p className="font-secondary text-[11px] uppercase tracking-widest text-[#7A7151]">
                          Today
                        </p>
                        <ul className="mt-2 space-y-1">
                          {acts.map((a, i) => (
                            <li key={i} className="text-[13px] text-[#4a4a4a]">
                              <span className="text-[#C7B892]">— </span>
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="space-y-2">
                      {day.accommodation && (
                        <p className="text-[13px] text-[#4a4a4a]">
                          <span className="font-secondary text-[11px] uppercase tracking-widest text-[#7A7151]">
                            Stay
                          </span>
                          <span className="ml-2">{day.accommodation}</span>
                        </p>
                      )}
                      {day.meals_included && day.meals_included.length > 0 && (
                        <p className="text-[13px] text-[#4a4a4a]">
                          <span className="font-secondary text-[11px] uppercase tracking-widest text-[#7A7151]">
                            Table
                          </span>
                          <span className="ml-2">{day.meals_included.join(" · ")}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
