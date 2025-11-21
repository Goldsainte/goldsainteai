import { cn } from "@/lib/utils";

interface InProgressTripCardProps {
  collectionTitle: string;
  brandName: string;
  notes?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  budgetRange?: string | null;
}

export function InProgressTripCard({
  collectionTitle,
  brandName,
  notes,
  checkIn,
  checkOut,
  budgetRange,
}: InProgressTripCardProps) {
  return (
    <div className="flex flex-col rounded-[20px] border border-[#E5DFC6] bg-[#FDFBF5] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#A4987C]">
            In progress
          </p>
          <h3 className="mt-1 text-sm font-semibold text-[#0a2225]">
            {collectionTitle}
          </h3>
          <p className="mt-1 text-[12px] text-[#6E6650]">Brand: {brandName}</p>
        </div>
        <span className="rounded-full bg-[#E0F3E4] px-3 py-1 text-[11px] text-[#295C3B]">
          Active
        </span>
      </div>
      {notes && (
        <p className="mt-2 line-clamp-2 text-[12px] text-[#4A4A4A]">"{notes}"</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#6E6650]">
        {checkIn && checkOut && (
          <span>
            {checkIn} – {checkOut}
          </span>
        )}
        {budgetRange && (
          <span className="rounded-full bg-[#F5EFE1] px-2 py-[2px]">
            {budgetRange}
          </span>
        )}
      </div>
    </div>
  );
}
