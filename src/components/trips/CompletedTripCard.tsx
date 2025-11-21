import { cn } from "@/lib/utils";

interface CompletedTripCardProps {
  collectionTitle: string;
  brandName: string;
  notes?: string | null;
}

export function CompletedTripCard({
  collectionTitle,
  brandName,
  notes,
}: CompletedTripCardProps) {
  return (
    <div className="flex flex-col rounded-[20px] border border-[#E5DFC6] bg-white p-4 opacity-90">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#A4987C]">
            Completed
          </p>
          <h3 className="mt-1 text-sm font-semibold text-[#0a2225]">
            {collectionTitle}
          </h3>
          <p className="mt-1 text-[12px] text-[#6E6650]">Brand: {brandName}</p>
        </div>
        <span className="rounded-full bg-[#E0E6F3] px-3 py-1 text-[11px] text-[#384B7A]">
          Done
        </span>
      </div>
      {notes && (
        <p className="mt-2 line-clamp-2 text-[12px] text-[#4A4A4A]">"{notes}"</p>
      )}
    </div>
  );
}
