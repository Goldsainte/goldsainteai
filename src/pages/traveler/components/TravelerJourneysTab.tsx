import { useState } from "react";
import { TravelerTripsTab } from "./TravelerTripsTab";
import { TravelerBookingsTab } from "./TravelerBookingsTab";

interface Props {
  userId: string;
}

export function TravelerJourneysTab({ userId }: Props) {
  const [view, setView] = useState<"requests" | "bookings">("requests");

  return (
    <div className="space-y-8">
      <div className="border-t border-[#0a2225]/10 pt-8">
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
          Your Journeys
        </p>
        <h2 className="mt-2 md:mt-3 font-secondary text-2xl md:text-3xl text-[#0a2225] leading-tight">
          Requests, proposals and confirmed trips
        </h2>
      </div>

      <div className="flex w-full sm:w-auto sm:inline-flex rounded-full border border-[#0a2225]/15 p-1 bg-white">
        <button
          type="button"
          onClick={() => setView("requests")}
          className={`flex-1 sm:flex-none px-4 sm:px-5 h-10 sm:h-9 rounded-full text-xs tracking-wide transition-colors ${
            view === "requests"
              ? "bg-[#0c4d47] text-[#f7f3ea]"
              : "text-[#0a2225]/70 hover:text-[#0a2225]"
          }`}
        >
          Requests
        </button>
        <button
          type="button"
          onClick={() => setView("bookings")}
          className={`flex-1 sm:flex-none px-4 sm:px-5 h-10 sm:h-9 rounded-full text-xs tracking-wide transition-colors ${
            view === "bookings"
              ? "bg-[#0c4d47] text-[#f7f3ea]"
              : "text-[#0a2225]/70 hover:text-[#0a2225]"
          }`}
        >
          Bookings
        </button>
      </div>

      {view === "requests" ? (
        <TravelerTripsTab userId={userId} />
      ) : (
        <TravelerBookingsTab userId={userId} />
      )}
    </div>
  );
}