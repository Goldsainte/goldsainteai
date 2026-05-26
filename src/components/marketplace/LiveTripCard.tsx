import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { MapPin, Calendar, Heart, Star } from "lucide-react";
import { CreatorAttribution } from "./CreatorAttribution";
import logomark from "@/assets/logomark-gold.webp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ShareButton } from "@/components/ShareButton";

interface LiveTripCardProps {
  trip: {
    id: string;
    slug: string;
    title: string;
    destination: string;
    cover_image_url: string | null;
    price_per_person: number;
    currency: string;
    duration_nights?: number | null;
    duration_days?: number;
    highlights?: string[] | null;
    tags?: string[] | null;
    creator_type?: string | null;
    wishlist_count?: number | null;
    booking_count?: number | null;
    view_count?: number | null;
    weekly_booking_count?: number | null;
    is_verified?: boolean | null;
    created_at?: string | null;
    rating?: number | null;
    review_count?: number | null;
    max_participants?: number | null;
    current_bookings?: number | null;
    creator?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      home_base?: string | null;
      content_style_tags?: string[] | null;
    } | null;
    signal?: "trending" | "new" | "recently-booked" | null;
  };
}

export function LiveTripCard({ trip }: LiveTripCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [savingPending, setSavingPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setIsSaved(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("trip_wishlists" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("trip_id", trip.id)
        .maybeSingle();
      if (!cancelled) setIsSaved(!!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, trip.id]);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) {
      toast.message("Sign in to save trips");
      navigate("/auth?mode=signup");
      return;
    }
    if (savingPending) return;
    setSavingPending(true);
    const next = !isSaved;
    setIsSaved(next);
    try {
      if (next) {
        const { error } = await supabase
          .from("trip_wishlists" as any)
          .upsert(
            { user_id: user.id, trip_id: trip.id },
            { onConflict: "user_id,trip_id" }
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("trip_wishlists" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("trip_id", trip.id);
        if (error) throw error;
      }
    } catch (err) {
      setIsSaved(!next);
      toast.error("Could not update saved trips");
    } finally {
      setSavingPending(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getDuration = (): number => {
    return trip.duration_nights ?? trip.duration_days ?? 0;
  };

  // Derive a soft signal automatically if not provided
  const derivedSignal = (() => {
    if (trip.signal) return trip.signal;
    const ageMs = trip.created_at ? Date.now() - new Date(trip.created_at).getTime() : Infinity;
    const within14d = ageMs < 14 * 24 * 60 * 60 * 1000;
    const within30d = ageMs < 30 * 24 * 60 * 60 * 1000;
    if (within30d && (trip.view_count ?? 0) > 100) return "trending";
    if (within14d) return "new";
    if ((trip.weekly_booking_count ?? 0) > 3) return "recently-booked";
    return null;
  })();

  const signalLabel = derivedSignal === "trending"
    ? "Trending"
    : derivedSignal === "new"
      ? "New"
      : derivedSignal === "recently-booked"
        ? `Booked ${trip.weekly_booking_count} times this week`
        : null;

  const styleTag = trip.creator?.content_style_tags?.[0];
  const saveCount = trip.wishlist_count ?? 0;
  const bookingCount = trip.booking_count ?? 0;

  const roleBadge = (() => {
    const t = trip.creator_type;
    if (!t || t === "platform") return null;
    if (t === "agent") return { label: "Travel Agent", className: "bg-[#0c4d47]/8 text-[#0c4d47] ring-[#0c4d47]/20" };
    if (t === "creator") return { label: "Creator", className: "bg-[#C7A962]/15 text-[#7a5a13] ring-[#C7A962]/30" };
    return null;
  })();

  return (
    <article
      onClick={() => navigate(`/marketplace/trip/${trip.slug || trip.id}`)}
      className="group cursor-pointer space-y-2.5"
    >
      {/* Image with optional editorial signal pill */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
        <img
          src={getTripRequestImageUrl(trip.destination, trip.cover_image_url)}
          alt={trip.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            const fallback = getTripRequestImageUrl(trip.destination, null);
            if (img.src !== fallback) img.src = fallback;
          }}
        />
        {signalLabel && (
          <span className="absolute left-3 top-3 rounded-full bg-[#FDF9F0]/95 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[#0c4d47] ring-1 ring-[#0c4d47]/20 backdrop-blur-sm">
            {signalLabel}
          </span>
        )}
        {styleTag && (
          <span className="absolute right-3 bottom-3 rounded-full bg-[#0a2225]/70 px-2.5 py-1 text-[10px] font-secondary italic text-[#FDF9F0] backdrop-blur-sm">
            {styleTag}
          </span>
        )}
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          <div onClick={(e) => e.stopPropagation()}>
            <ShareButton
              variant="icon"
              url={`/marketplace/trip/${trip.slug || trip.id}`}
              title={trip.title}
              description={trip.destination}
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            aria-label={isSaved ? "Remove from saved" : "Save trip"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/85 backdrop-blur shadow-sm ring-1 ring-black/5 transition hover:bg-white"
          >
            <Heart
              className={`h-4 w-4 transition ${isSaved ? "text-[#C7A962] fill-[#C7A962]" : "text-[#0a2225]"}`}
            />
          </button>
        </div>
      </div>

      {/* Content below image */}
      <div className="space-y-1 px-0.5">
        {trip.creator ? (
          <div className="mb-1 flex items-center gap-1.5">
            <CreatorAttribution creator={trip.creator} />
            {roleBadge && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ring-1 ${roleBadge.className}`}
              >
                {roleBadge.label}
              </span>
            )}
          </div>
        ) : trip.creator_type === "platform" ? (
          <div className="mb-1 flex items-center gap-1.5">
            <img
              src={logomark}
              alt="Goldsainte"
              className="h-5 w-5 rounded-full object-contain ring-1 ring-[#C7B892]/40 bg-[#0c4d47] p-0.5"
              loading="lazy"
            />
            <span className="text-[11px] text-[#7A7151] truncate">
              <span className="text-[#6B7280]">Curated by </span>
              <span className="font-secondary italic text-[#0a2225]">Goldsainte</span>
            </span>
          </div>
        ) : null}
        {typeof trip.rating === "number" && trip.rating > 0 && (
          <p className="flex items-center gap-1 text-[12px] text-[#0a2225]">
            <Star className="h-3 w-3 fill-[#C7A962] text-[#C7A962]" />
            <span className="font-medium">{trip.rating.toFixed(1)}</span>
            {typeof trip.review_count === "number" && trip.review_count > 0 && (
              <span className="text-[#6B7280]">({trip.review_count})</span>
            )}
          </p>
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-secondary text-sm md:text-[15px] text-[#0a2225] font-medium leading-snug line-clamp-1">
            {trip.title}
          </h3>
          <span className="text-sm md:text-[15px] font-semibold text-[#0a2225] whitespace-nowrap">
            {formatPrice(trip.price_per_person, trip.currency)}
          </span>
        </div>

        <p className="flex items-center gap-1 text-[13px] text-[#6B7280]">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{trip.destination}</span>
        </p>

        <p className="flex items-center gap-1 text-[13px] text-[#6B7280]">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{getDuration()} nights</span>
        </p>

        {typeof trip.max_participants === "number" &&
          typeof trip.current_bookings === "number" &&
          trip.max_participants - trip.current_bookings > 0 &&
          trip.max_participants - trip.current_bookings <= 3 && (
            <span className="inline-block rounded-full bg-[#b85c3a]/10 px-2 py-0.5 text-[11px] font-medium text-[#b85c3a]">
              Only {trip.max_participants - trip.current_bookings} spot
              {trip.max_participants - trip.current_bookings === 1 ? "" : "s"} left
            </span>
          )}

        {(saveCount > 0 || bookingCount > 0) && (
          <div className="pt-0.5 text-[11px] text-[#7A7151] space-y-0.5">
            {saveCount > 0 && (
              <p>{saveCount.toLocaleString()} saves</p>
            )}
            {bookingCount > 0 && (
              <p>{bookingCount} booked</p>
            )}
          </div>
        )}

        {trip.created_at && (() => {
          const ageMs = Date.now() - new Date(trip.created_at).getTime();
          const days = Math.floor(ageMs / (1000 * 60 * 60 * 24));
          const months = Math.floor(days / 30);
          if (days < 14) return <p className="pt-0.5 text-[11px] text-[#7A7151]/80">New</p>;
          if (months < 3) return <p className="pt-0.5 text-[11px] text-[#7A7151]/80">{months}mo ago</p>;
          return null;
        })()}
      </div>
    </article>
  );
}
