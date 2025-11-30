import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Utensils, Home, Sparkles } from "lucide-react";

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
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
      <h2 className="font-secondary text-xl font-semibold text-[#0a2225]">
        Day-by-Day Itinerary
      </h2>

      <Accordion type="single" collapsible className="mt-4 space-y-3">
        {itinerary.map((day) => (
          <AccordionItem
            key={day.id}
            value={day.id}
            className="overflow-hidden rounded-xl border border-[#E5DFC6]/60 bg-[#FDF9F0]/50 px-0"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[#E5DFC6]/40">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#C7B892] text-[12px] font-semibold text-[#7A7151]">
                  {day.day_number}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-left text-[15px] font-medium text-[#0a2225]">
                    {day.title}
                  </span>
                  {day.is_featured_day && (
                    <Sparkles className="h-4 w-4 text-[#C7B892]" />
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-3">
              {day.description && (
                <p className="text-[14px] leading-relaxed text-[#4a4a4a]">
                  {day.description}
                </p>
              )}

              {/* Activities */}
              {Array.isArray(day.activities) && day.activities.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-[12px] font-semibold uppercase tracking-wide text-[#7A7151]">
                    Activities
                  </h4>
                  <ul className="mt-2 space-y-1.5">
                    {day.activities.map((activity, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[13px] text-[#4a4a4a]">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#C7B892]" />
                        {typeof activity === "string" ? activity : activity.name || activity.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meals & Accommodation */}
              <div className="mt-4 flex flex-wrap gap-4">
                {day.meals_included && day.meals_included.length > 0 && (
                  <div className="flex items-center gap-2 text-[13px] text-[#4a4a4a]">
                    <Utensils className="h-4 w-4 text-[#818181]" />
                    <span>
                      <span className="font-medium">Meals:</span>{" "}
                      {day.meals_included.join(", ")}
                    </span>
                  </div>
                )}
                {day.accommodation && (
                  <div className="flex items-center gap-2 text-[13px] text-[#4a4a4a]">
                    <Home className="h-4 w-4 text-[#818181]" />
                    <span>
                      <span className="font-medium">Stay:</span> {day.accommodation}
                    </span>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
