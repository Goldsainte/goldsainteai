import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Star, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Trip = {
  id: string;
  title: string;
  slug?: string;
  destination: string;
  country: string;
  duration_days: number;
  min_participants: number;
  max_participants: number;
  retail_price_per_person: number;
  currency: string;
  rating?: number;
  review_count?: number;
  creator_id: string;
  agent_id?: string;
  creator_type: string;
  cover_image_url?: string;
  image_gallery?: string[];
  tags?: string[];
  description: string;
  highlights?: string[];
  included?: string[];
  not_included?: string[];
  travel_window?: string;
  deposit_note?: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url?: string;
  };
  travel_agents?: {
    agency_name: string;
    profile_image_url?: string;
    user_id: string;
    is_verified: boolean;
  };
};

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedGuests, setSelectedGuests] = useState(2);
  const [selectedDatesNote, setSelectedDatesNote] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const { data: trip, isLoading, error } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("packaged_trips")
        .select(`
          *,
          profiles:creator_id(full_name, username, avatar_url),
          travel_agents:agent_id(agency_name, profile_image_url, user_id, is_verified)
        `)
        .eq("id", id)
        .eq("status", "published")
        .single();

      if (error) throw error;
      return data as Trip;
    },
    enabled: !!id,
  });

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleRequestToBook = async () => {
    if (!trip || !user) return;

    try {
      const { error } = await (supabase as any).from("trip_bookings").insert({
        trip_id: trip.id,
        customer_id: user.id,
        guests: selectedGuests,
        preferred_dates: selectedDatesNote,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Booking request sent!",
        description: "The creator will review your request and get back to you.",
      });

      navigate("/messages");
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to send booking request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAskQuestion = async () => {
    if (!trip || !user) return;

    try {
      const creatorUserId = trip.travel_agents?.user_id || trip.creator_id;

      // Check for existing conversation
      const { data: existingConversation } = await (supabase as any)
        .from("user_conversations")
        .select("id")
        .eq("customer_id", user.id)
        .eq("agent_id", trip.agent_id)
        .maybeSingle();

      if (existingConversation) {
        navigate(`/messages?conversation=${existingConversation.id}`);
      } else if (trip.agent_id) {
        // Create new conversation
        const { data: newConversation } = await (supabase as any)
          .from("user_conversations")
          .insert({
            customer_id: user.id,
            agent_id: trip.agent_id,
            status: "active",
          })
          .select()
          .single();

        if (newConversation) {
          navigate(`/messages?conversation=${newConversation.id}`);
        }
      } else {
        toast({
          title: "Contact unavailable",
          description: "Unable to start a conversation. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to open conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea] text-[#0a2225]">
        <Card className="p-4">
          <p className="text-sm text-destructive">
            {error?.message || "Trip not found."}
          </p>
        </Card>
      </div>
    );
  }

  const heroImages = trip.image_gallery || [trip.cover_image_url];
  const creatorName = trip.travel_agents?.agency_name || trip.profiles?.full_name || "Creator";
  const creatorHandle = trip.profiles?.username ? `@${trip.profiles.username}` : "";
  const creatorAvatar = trip.travel_agents?.profile_image_url || trip.profiles?.avatar_url;
  const isVerified = trip.travel_agents?.is_verified || false;

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        {/* Breadcrumb */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to marketplace
        </button>

        {/* Title */}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl text-foreground">
          {trip.title}
        </h1>

        {/* Meta info */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">{trip.destination} · {trip.country}</span>
          <span>•</span>
          <span>{trip.duration_days} days</span>
          <span>•</span>
          <span>
            For {trip.min_participants === trip.max_participants
              ? `${trip.min_participants} guests`
              : `${trip.min_participants}-${trip.max_participants} guests`}
          </span>
          {trip.rating && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-[#C7A962] text-[#C7A962]" />
                {trip.rating.toFixed(2)}
                {trip.review_count && (
                  <span className="text-muted-foreground">({trip.review_count})</span>
                )}
              </span>
            </>
          )}
        </div>

        {/* Image gallery */}
        <section className="mt-5 grid gap-2 md:h-80 md:grid-cols-4">
          <div className="relative h-56 overflow-hidden rounded-2xl md:col-span-2 md:h-full">
            <img
              src={heroImages[0]}
              alt={trip.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="hidden gap-2 md:grid md:grid-rows-2">
            {heroImages.slice(1, 3).map((img, index) => (
              <div key={index} className="relative h-full overflow-hidden rounded-2xl">
                <img
                  src={img}
                  alt={`${trip.title} ${index + 2}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Main layout */}
        <section className="mt-6 flex flex-col gap-6 md:flex-row">
          {/* LEFT: content */}
          <div className="w-full md:w-2/3 space-y-4">
            {/* Creator info */}
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
                  {creatorAvatar ? (
                    <img
                      src={creatorAvatar}
                      alt={creatorName}
                      className="h-full w-full object-cover"
                    loading="lazy"/>
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                      {creatorName.split(" ").map((n) => n[0]).join("")}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {creatorName}
                    </span>
                    {creatorHandle && (
                      <span className="text-xs text-muted-foreground">
                        {creatorHandle}
                      </span>
                    )}
                    {isVerified && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        Verified {trip.creator_type}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Trip curated by a {trip.creator_type === "agent" ? "certified travel professional" : "travel creator"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Overview */}
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-foreground">Overview</h2>
              <p className="mt-2 text-sm text-muted-foreground">{trip.description}</p>

              {trip.travel_window && (
                <div className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs text-foreground">
                  <span className="font-semibold">Travel window: </span>
                  {trip.travel_window}
                </div>
              )}

              {trip.tags && trip.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {trip.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Highlights */}
            {trip.highlights && trip.highlights.length > 0 && (
              <Card className="p-4">
                <h2 className="text-sm font-semibold text-foreground">Highlights</h2>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs text-muted-foreground">
                  {trip.highlights.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Included / Not included */}
            <div className="grid gap-4 md:grid-cols-2">
              {trip.included && trip.included.length > 0 && (
                <Card className="p-4">
                  <h2 className="text-sm font-semibold text-foreground">What's included</h2>
                  <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs text-muted-foreground">
                    {trip.included.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </Card>
              )}

              {trip.not_included && trip.not_included.length > 0 && (
                <Card className="p-4">
                  <h2 className="text-sm font-semibold text-foreground">What's not included</h2>
                  <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs text-muted-foreground">
                    {trip.not_included.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </div>

          {/* RIGHT: booking panel */}
          <aside className="w-full md:w-1/3">
            <div className="sticky top-20">
              <Card className="p-4 shadow-lg">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-semibold text-foreground">
                        {formatCurrency(trip.retail_price_per_person, trip.currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">per person</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      For {trip.duration_days} days, up to {trip.max_participants} guests
                    </p>
                  </div>

                  {trip.rating && (
                    <div className="flex items-center gap-1 text-xs text-foreground">
                      <Star className="h-3 w-3 fill-[#C7A962] text-[#C7A962]" />
                      {trip.rating.toFixed(2)}
                      {trip.review_count && (
                        <span className="text-muted-foreground">({trip.review_count})</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Booking form */}
                <div className="mt-3 space-y-3 rounded-xl border border-border bg-muted/50 p-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-foreground">
                      Guests
                    </label>
                    <select
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={selectedGuests}
                      onChange={(e) => setSelectedGuests(Number(e.target.value))}
                    >
                      {Array.from(
                        { length: trip.max_participants - trip.min_participants + 1 },
                        (_, i) => trip.min_participants + i
                      ).map((count) => (
                        <option key={count} value={count}>
                          {count} {count === 1 ? "guest" : "guests"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-foreground">
                      Preferred travel dates
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. June 10–18, 2026 or 'flexible'"
                      value={selectedDatesNote}
                      onChange={(e) => setSelectedDatesNote(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleRequestToBook}
                  className="mt-4 w-full"
                  size="lg"
                >
                  Request to book
                </Button>

                <Button
                  variant="outline"
                  onClick={handleAskQuestion}
                  className="mt-2 w-full"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Ask a question
                </Button>

                {trip.deposit_note && (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {trip.deposit_note}
                  </p>
                )}

                <p className="mt-3 text-[10px] text-muted-foreground">
                  Payments are processed securely. Your creator will confirm details before charging.
                </p>
              </Card>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
