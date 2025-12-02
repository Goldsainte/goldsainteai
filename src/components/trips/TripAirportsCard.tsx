import { Plane } from "lucide-react";

interface TripAirportsCardProps {
  arrivalAirport?: string;
  departureAirport?: string;
}

export function TripAirportsCard({ arrivalAirport, departureAirport }: TripAirportsCardProps) {
  if (!arrivalAirport && !departureAirport) return null;

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
      <h2 className="font-secondary text-xl font-semibold text-[#0a2225]">
        Airports
      </h2>

      <div className="mt-4 space-y-4">
        {arrivalAirport && (
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDF9F0]">
              <Plane className="h-5 w-5 text-[#0C4D47]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                Recommended Arrival Airport
              </p>
              <p className="mt-0.5 font-medium text-[#0a2225]">{arrivalAirport}</p>
            </div>
          </div>
        )}

        {departureAirport && (
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDF9F0]">
              <Plane className="h-5 w-5 rotate-90 text-[#0C4D47]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                Recommended Departure Airport
              </p>
              <p className="mt-0.5 font-medium text-[#0a2225]">{departureAirport}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
