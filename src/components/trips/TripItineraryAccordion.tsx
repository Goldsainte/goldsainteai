import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { UtensilsCrossed, Home, MapPin } from "lucide-react";

interface ItineraryActivity {
  name: string;
  description?: string;
  duration?: string;
  location?: string;
}

interface ItineraryDay {
  id: string;
  day_number: number;
  title: string;
  description?: string;
  activities?: ItineraryActivity[];
  meals_included?: string[];
  accommodation?: string;
  accommodation_type?: string;
  overnight_location?: string;
}

interface TripItineraryAccordionProps {
  days: ItineraryDay[];
  totalNights?: number;
}

export function TripItineraryAccordion({ days, totalNights }: TripItineraryAccordionProps) {
  if (!days || days.length === 0) return null;

  const getMealIcon = (meal: string) => {
    return <UtensilsCrossed className="h-3.5 w-3.5" />;
  };

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
      <h2 className="font-secondary text-xl font-semibold text-[#0a2225]">
        Itinerary
      </h2>
      <p className="mt-1 text-xs text-[#6B7280]">*All durations are approximate</p>

      <Accordion type="single" collapsible className="mt-4 space-y-2">
        {days.map((day, idx) => (
          <AccordionItem
            key={day.id}
            value={`day-${day.day_number}`}
            className="overflow-hidden rounded-xl border border-[#E5DFC6]"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-[#FDF9F0]/50">
              <div className="flex items-center gap-3 text-left">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0C4D47] text-sm font-semibold text-white">
                  {day.day_number}
                </span>
                <span className="font-medium text-[#0a2225]">{day.title}</span>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="border-t border-[#E5DFC6]/50 bg-[#FDF9F0]/30 px-4 py-4">
              {/* Description */}
              {day.description && (
                <p className="text-[14px] leading-relaxed text-[#4a4a4a]">
                  {day.description}
                </p>
              )}

              {/* Activities */}
              {day.activities && day.activities.length > 0 && (
                <div className="mt-4 space-y-3">
                  {day.activities.map((activity, actIdx) => (
                    <div
                      key={actIdx}
                      className="flex items-start gap-3 rounded-lg bg-white p-3 border border-[#E5DFC6]/50"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#C7B892]" />
                      <div>
                        <p className="font-medium text-[#0a2225]">{activity.name}</p>
                        {activity.description && (
                          <p className="mt-1 text-sm text-[#6B7280]">{activity.description}</p>
                        )}
                        {activity.duration && (
                          <p className="mt-1 text-xs text-[#7A7151]">{activity.duration}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Meals */}
              {day.meals_included && day.meals_included.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {day.meals_included.map((meal, mealIdx) => (
                    <span
                      key={mealIdx}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#C7B892]/20 px-3 py-1 text-xs font-medium text-[#7A7151]"
                    >
                      {getMealIcon(meal)}
                      {meal}
                    </span>
                  ))}
                </div>
              )}

              {/* Accommodation */}
              {day.accommodation && (
                <div className="mt-4 flex items-start gap-3 rounded-lg bg-white p-3 border border-[#E5DFC6]/50">
                  <Home className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0C4D47]" />
                  <div>
                    <p className="text-sm font-medium text-[#0a2225]">
                      {day.accommodation}
                    </p>
                    {day.accommodation_type && (
                      <p className="text-xs text-[#6B7280]">({day.accommodation_type})</p>
                    )}
                  </div>
                </div>
              )}

              {/* Overnight Info */}
              {day.overnight_location && totalNights && (
                <div className="mt-4 rounded-lg bg-[#0a2225] p-3 text-center">
                  <p className="text-sm text-white">
                    Night {idx + 1}/{totalNights} · Overnight in{" "}
                    <span className="font-medium">{day.overnight_location}</span>
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
