import { LiveTripCard } from "./LiveTripCard";

interface LiveTripGridProps {
  trips: Array<{
    id: string;
    slug: string;
    title: string;
    destination: string;
    cover_image_url: string | null;
    price_per_person: number;
    currency: string;
    duration_days: number;
    max_participants: number;
    current_bookings: number;
    difficulty_level: string | null;
    rating: number | null;
    review_count: number | null;
    available_from: string | null;
    available_until: string | null;
    tags: string[] | null;
    creator?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  }>;
}

export function LiveTripGrid({ trips }: LiveTripGridProps) {
  return (
    <div className="grid gap-x-4 gap-y-8 grid-cols-1 sm:gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {trips.map((trip) => (
        <LiveTripCard key={trip.id} trip={trip as any} />
      ))}
    </div>
  );
}
