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
          <div className="flex items-baseline gap-3">
            <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#C7A962]" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151]">
                Recommended Arrival Airport
              </p>
              <p className="mt-0.5 font-medium text-[#0a2225]">{arrivalAirport}</p>
            </div>
          </div>
        )}

        {departureAirport && (
          <div className="flex items-baseline gap-3">
            <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#C7A962]" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151]">
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
