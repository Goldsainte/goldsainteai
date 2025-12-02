import { Check, X } from "lucide-react";

interface TripInclusionsCardProps {
  included: string[];
  notIncluded: string[];
}

export function TripInclusionsCard({ included, notIncluded }: TripInclusionsCardProps) {
  if (included.length === 0 && notIncluded.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Included */}
        {included.length > 0 && (
          <div>
            <h3 className="font-secondary text-lg font-semibold text-[#0a2225]">
              Included in Your Trip
            </h3>
            <ul className="mt-4 space-y-3">
              {included.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#0C4D47]">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[14px] text-[#4a4a4a]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Not Included */}
        {notIncluded.length > 0 && (
          <div>
            <h3 className="font-secondary text-lg font-semibold text-[#0a2225]">
              Not Included
            </h3>
            <ul className="mt-4 space-y-3">
              {notIncluded.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#E5DFC6]">
                    <X className="h-3 w-3 text-[#7A7151]" />
                  </div>
                  <span className="text-[14px] text-[#6B7280]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
