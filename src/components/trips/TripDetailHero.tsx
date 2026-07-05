import { useState } from "react";
import { Calendar, Users, Clock, Activity, ChevronLeft, ChevronRight, Images, X } from "lucide-react";
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
      {useMosaic ? (
        /* ── GetYourGuide-style mosaic: large lead tile + stacked side tiles ── */
        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-2 md:h-[440px]">
          {/* Lead tile */}
          <button
            type="button"
            onClick={() => openLightboxAt(0)}
            className="relative md:col-span-2 md:row-span-2 overflow-hidden rounded-2xl md:rounded-r-none group aspect-[16/10] md:aspect-auto"
          >
            <img
              src={allImages[0]}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            {spotsAvailable !== undefined && spotsAvailable > 0 && (
              <div className="absolute right-4 top-4 rounded-full bg-white/95 px-4 py-1.5 text-sm font-medium text-[#0a2225] shadow-lg">
                {spotsAvailable} spots left
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-left">
              <h1 className="font-secondary text-2xl md:text-4xl font-bold text-white drop-shadow-lg">
                {title}
                {hostName && hostName !== "Host" && (
                  <span className="text-[#C7B892]"> with {hostName}</span>
                )}
              </h1>
            </div>
          </button>
          {/* Side tiles (hidden on mobile — lead tile carries mobile) */}
          <button
            type="button"
            onClick={() => openLightboxAt(1)}
            className="relative hidden md:block overflow-hidden rounded-tr-2xl group"
          >
            <img
              src={allImages[1]}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
            />
          </button>
          <button
            type="button"
            onClick={() => openLightboxAt(2)}
            className="relative hidden md:block overflow-hidden rounded-br-2xl group"
          >
            <img
              src={allImages[2]}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
            />
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-medium text-[#0a2225] shadow-lg group-hover:bg-white">
              <Images className="h-3.5 w-3.5" />
              View all {allImages.length}
            </span>
          </button>
        </div>
      ) : (
      <>
      {/* Hero Image */}
      <div className="relative aspect-[21/9] md:aspect-[21/9] w-full overflow-hidden rounded-2xl">
        <img
          src={allImages[currentImageIndex] || "/placeholder.svg"}
          alt={title}
          className="h-full w-full object-cover"
        loading="lazy"/>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

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

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <h1 className="font-secondary text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
            {title}
            {hostName && hostName !== "Host" && (
              <span className="text-[#C7B892]"> with {hostName}</span>
            )}
          </h1>
        </div>
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
