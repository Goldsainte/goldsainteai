import { useState } from "react";
import { Calendar, Users, Clock, Activity, ChevronLeft, ChevronRight, Images, X, Star } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TripDetailHeroProps {
  title: string;
  hostName: string;
  coverImage: string;
  galleryImages?: string[];
  startDate?: string;
  endDate?: string;
  groupSizeMin?: number;
  groupSizeMax?: number;
  groupSizeNote?: string;
  durationDays: number;
  durationNights?: number;
  activityLevel?: string;
  spotsAvailable?: number;
  /** Real rating from packaged_trips.rating — header row shows it only when present. */
  rating?: number | null;
  destination?: string;
  /** Right-aligned header actions (e.g. Share button). */
  actionsSlot?: React.ReactNode;
}

export function TripDetailHero({
  title,
  hostName,
  coverImage,
  galleryImages = [],
  startDate,
  endDate,
  groupSizeMin,
  groupSizeMax,
  groupSizeNote,
  durationDays,
  durationNights,
  activityLevel,
  spotsAvailable,
  rating,
  destination,
  actionsSlot,
}: TripDetailHeroProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const allImages = [coverImage, ...galleryImages].filter(Boolean);
  // GetYourGuide-style mosaic needs at least 3 real images; anything fewer
  // falls back to the single hero so sparse trips never show empty tiles.
  const useMosaic = allImages.length >= 3;
  const openLightboxAt = (idx: number) => {
    setCurrentImageIndex(idx);
    setLightboxOpen(true);
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return "Dates TBD";
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${format(start, "MMM d")}–${format(end, "d, yyyy")}`;
  };

  const formatGroupSize = () => {
    if (groupSizeNote) return groupSizeNote;
    if (groupSizeMin && groupSizeMax) return `${groupSizeMin}–${groupSizeMax} Travelers`;
    if (groupSizeMax) return `Up to ${groupSizeMax} Travelers`;
    return "Group Trip";
  };

  const formatDuration = () => {
    const nights = durationNights ?? durationDays - 1;
    return `${durationDays} days, ${nights} nights`;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <section className="relative">
      {/* ── Title block ABOVE the images (GetYourGuide pattern) ── */}
      <div className="mb-4">
        <h1 className="font-secondary text-3xl md:text-4xl font-bold text-[#0a2225] leading-tight">
          {title}
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Only real numbers: the rating row renders solely when a rating exists. */}
          {rating != null && rating > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm text-[#0a2225]">
              <Star className="h-4 w-4 fill-[#C7A962] text-[#C7A962]" />
              <span className="font-semibold">{Number(rating).toFixed(1)}</span>
            </span>
          )}
          {hostName && hostName !== "Host" && (
            <span className="text-sm text-[#4a4a4a]">
              Trip by <span className="font-medium text-[#0a2225]">{hostName}</span>
            </span>
          )}
          {destination && (
            <span className="text-sm text-[#6B7280]">{destination}</span>
          )}
          {actionsSlot && <span className="ml-auto">{actionsSlot}</span>}
        </div>
      </div>

      {useMosaic ? (
        /* ── GetYourGuide mosaic 1:1 — clean images, no text overlay:
              left half = lead tile; right half = wide tile over two small ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:h-[460px]">
          {/* Lead tile — left half, full height */}
          <button
            type="button"
            onClick={() => openLightboxAt(0)}
            className="relative overflow-hidden rounded-2xl md:rounded-r-none group aspect-[16/10] md:aspect-auto md:h-full"
          >
            <img
              src={allImages[0]}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            {spotsAvailable !== undefined && spotsAvailable > 0 && (
              <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-medium text-[#0a2225] shadow-lg">
                {spotsAvailable} spots left
              </div>
            )}
          </button>

          {/* Right half: wide tile on top, two small below */}
          <div className="hidden md:flex flex-col gap-2 h-full min-h-0">
            <button
              type="button"
              onClick={() => openLightboxAt(1)}
              className="relative overflow-hidden rounded-tr-2xl group flex-[1.15] min-h-0"
            >
              <img
                src={allImages[1]}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
                onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
              />
            </button>
            <div className={`grid gap-2 flex-1 min-h-0 ${allImages.length > 3 ? "grid-cols-2" : "grid-cols-1"}`}>
              <button
                type="button"
                onClick={() => openLightboxAt(2)}
                className={`relative overflow-hidden group ${allImages.length > 3 ? "" : "rounded-br-2xl"}`}
              >
                <img
                  src={allImages[2]}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                  onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
                />
                {/* With exactly 3 images this tile spans full width and carries View all */}
                {allImages.length === 3 && (
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-medium text-[#0a2225] shadow-lg group-hover:bg-white">
                    <Images className="h-3.5 w-3.5" />
                    View all
                  </span>
                )}
              </button>
              {allImages.length > 3 && (
                <button
                  type="button"
                  onClick={() => openLightboxAt(3)}
                  className="relative overflow-hidden rounded-br-2xl group"
                >
                  <img
                    src={allImages[3]}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
                  />
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-medium text-[#0a2225] shadow-lg group-hover:bg-white">
                    <Images className="h-3.5 w-3.5" />
                    View all
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
      <>
      {/* Hero Image (fallback for trips with fewer than 3 images) */}
      <div className="relative aspect-[21/9] md:aspect-[21/9] w-full overflow-hidden rounded-2xl">
        <img
          src={allImages[currentImageIndex] || "/placeholder.svg"}
          alt={title}
          className="h-full w-full object-cover"
        loading="lazy"/>

        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5 text-[#0a2225]" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5 text-[#0a2225]" />
            </button>
          </>
        )}

        {/* Spots Available Badge */}
        {spotsAvailable !== undefined && spotsAvailable > 0 && (
          <div className="absolute right-4 top-4 rounded-full bg-white/95 px-4 py-1.5 text-sm font-medium text-[#0a2225] shadow-lg">
            {spotsAvailable} spots left
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {allImages.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={cn(
                "h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition",
                currentImageIndex === idx
                  ? "border-[#C7B892]"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img src={img} alt="" className="h-full w-full object-cover" loading="lazy"/>
            </button>
          ))}
        </div>
      )}
      </>
      )}

      {/* Lightbox — full gallery viewer for the mosaic */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            aria-label="Close gallery"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img
            src={allImages[currentImageIndex]}
            alt={title}
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-white/80 tabular-nums">
            {currentImageIndex + 1} / {allImages.length}
          </p>
        </div>
      )}

      {/* Info Cards Row */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <InfoCard icon={Calendar} label="Dates" value={formatDateRange()} />
        <InfoCard icon={Users} label="Group Size" value={formatGroupSize()} />
        <InfoCard icon={Clock} label="Duration" value={formatDuration()} />
        <InfoCard 
          icon={Activity} 
          label="Activity Level" 
          value={activityLevel || "Moderate"} 
          highlight={activityLevel === "Adventure"}
        />
      </div>
    </section>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E5DFC6] bg-white p-4 text-center">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#FDF9F0]">
        <Icon className={cn("h-5 w-5", highlight ? "text-[#C7B892]" : "text-[#0a2225]")} />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A7151]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#0a2225]">{value}</p>
    </div>
  );
}
