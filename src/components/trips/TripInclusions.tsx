import { Check, X } from "lucide-react";

interface TripInclusionsProps {
  included: string[] | null;
  notIncluded: string[] | null;
}

export function TripInclusions({ included, notIncluded }: TripInclusionsProps) {
  // Parse JSONB arrays if needed
  const includedItems = Array.isArray(included) ? included : [];
  const notIncludedItems = Array.isArray(notIncluded) ? notIncluded : [];

  if (includedItems.length === 0 && notIncludedItems.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* What's Included */}
      {includedItems.length > 0 && (
        <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
          <h3 className="font-secondary text-lg font-semibold text-[#0a2225]">
            What's Included
          </h3>
          <ul className="mt-4 space-y-3">
            {includedItems.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-[14px] text-[#4a4a4a]"
              >
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#0C4D47]/10">
                  <Check className="h-3 w-3 text-[#0C4D47]" />
                </span>
                <span>{typeof item === "string" ? item : (item as any).name || (item as any).title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* What's Not Included */}
      {notIncludedItems.length > 0 && (
        <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
          <h3 className="font-secondary text-lg font-semibold text-[#0a2225]">
            Not Included
          </h3>
          <ul className="mt-4 space-y-3">
            {notIncludedItems.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-[14px] text-[#4a4a4a]"
              >
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#818181]/10">
                  <X className="h-3 w-3 text-[#818181]" />
                </span>
                <span>{typeof item === "string" ? item : (item as any).name || (item as any).title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
