// src/components/MediaLibrarySidebar.tsx
import { useMediaLibrary } from "@/hooks/useMediaLibrary";

export function MediaLibrarySidebar({
  onSelect,
}: {
  onSelect: (url: string) => void;
}) {
  const { items, loading } = useMediaLibrary();

  return (
    <aside className="w-full md:w-64 rounded-3xl bg-black/30 border border-[#BFAD72]/30 p-3 space-y-3 text-xs">
      <p className="text-[11px] font-semibold text-[#BFAD72]">
        Storyboard library
      </p>
      <p className="text-[10px] text-[#E5DFC6]/75">
        Pull from Goldsainte's image set or your own uploads to design each
        scene of the trip.
      </p>

      {loading && (
        <p className="text-[10px] text-[#E5DFC6]/70">Loading images…</p>
      )}

      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="relative block rounded-2xl overflow-hidden bg-[#0a2225] border border-white/10 hover:border-[#BFAD72]/60"
            onClick={() => onSelect(item.url)}
          >
            <div
              className="aspect-[4/5] bg-cover bg-center"
              style={{
                backgroundImage: `url(${item.thumb_url || item.url})`,
              }}
            />
            {item.label && (
              <span className="absolute bottom-1 left-1 right-1 rounded-full bg-black/60 px-2 py-0.5 text-[9px] text-[#E5DFC6] truncate">
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
