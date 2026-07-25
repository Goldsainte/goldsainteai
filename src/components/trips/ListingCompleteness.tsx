import { Check, Circle } from "lucide-react";

// ============================================================================
// ListingCompleteness — the "Trova-grade" completeness meter (Jul 25).
// Purely presentational: computes which depth sections are still thin from
// the live form state, so agents can see what "done" looks like before they
// publish. Rendered on the final builder step next to the AI-draft button.
// ============================================================================

export type CompletenessInput = {
  formData: any;
  itineraryDays: Array<{
    day_number: number;
    title: string;
    description: string;
    activities: string[];
    accommodation: string;
    meals_included: string[];
  }>;
  noun: string; // "trip" | "tour"
};

export type CompletenessCheck = { id: string; label: string; done: boolean };

export function computeChecks({ formData, itineraryDays, noun }: CompletenessInput): CompletenessCheck[] {
  const days = itineraryDays || [];
  const dayCount = parseInt(formData.duration_days) || days.length;
  const allDaysWritten =
    days.length > 0 &&
    days.length >= dayCount &&
    days.every((d) => (d.description || "").trim().length >= 120);
  const daysHaveMeals = days.length > 0 && days.every((d) => (d.meals_included || []).length > 0);
  const daysHaveStay =
    days.length > 0 && days.slice(0, -1).every((d) => (d.accommodation || "").trim().length > 0);
  const isTrip = (formData.listing_type || "trip") === "trip";

  const checks: CompletenessCheck[] = [
    { id: "about", label: `About this ${noun} (150+ characters)`, done: (formData.description || "").trim().length >= 150 },
    { id: "days", label: "Every day has a real write-up", done: allDaysWritten },
    { id: "meals", label: "Meals noted on every day", done: daysHaveMeals },
    { id: "stay", label: "Accommodation noted per night", done: daysHaveStay },
    { id: "included", label: "At least 3 inclusions", done: (formData.included || []).length >= 3 },
    { id: "not_included", label: "At least 3 'Not included' items", done: (formData.not_included || []).length >= 3 },
    { id: "level", label: "Activity level set", done: Boolean(formData.activity_level) },
    { id: "faqs", label: "At least 3 FAQs", done: (formData.faqs || []).length >= 3 },
    { id: "photos", label: "Cover photo + 3 gallery images", done: Boolean(formData.cover_image_url) && (formData.image_gallery || []).length >= 3 },
  ];
  if (isTrip) {
    checks.push({
      id: "airports",
      label: "Arrival & departure airports",
      done: Boolean(formData.recommended_arrival_airport) && Boolean(formData.recommended_departure_airport),
    });
  }
  return checks;
}

export function ListingCompleteness(props: CompletenessInput) {
  const checks = computeChecks(props);
  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);

  return (
    <div className="rounded-2xl border border-[#E5DFC6] bg-white/70 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#8D6B2F]">
          Listing completeness
        </p>
        <p className="font-secondary text-xl text-[#0a2225]">{pct}%</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E5DFC6]/60">
        <div className="h-full rounded-full bg-[#0c4d47] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-[#0a2225]/55">
        Travelers spending thousands compare you to the most detailed listing they've ever seen. Complete listings win the booking.
      </p>
      <ul className="mt-4 space-y-2">
        {checks.map((c) => (
          <li key={c.id} className="flex items-center gap-2.5 text-[13.5px]">
            {c.done ? (
              <Check className="h-4 w-4 shrink-0 text-[#0c4d47]" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-[#C7A962]" />
            )}
            <span className={c.done ? "text-[#0a2225]/45 line-through decoration-[#0a2225]/20" : "text-[#0a2225]"}>
              {c.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
