import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { MarketplaceTabs } from "@/components/marketplace/MarketplaceTabs";
import { TripGrid } from "@/components/marketplace/TripGrid";
import { TripRequestGrid } from "@/components/marketplace/TripRequestGrid";
import { LiveTripGrid } from "@/components/marketplace/LiveTripGrid";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BackButton } from "@/components/ui/BackButton";

type Tab = "trips" | "trip-requests";

// Map UI filter names to database tag variants (case-insensitive matching)
const FILTER_TAG_MAP: Record<string, string[]> = {
  "Top Rated": [], // Special handling - sort by rating instead of filtering
  "Luxury": ["luxury", "high-end", "Luxury"],
  "Budget Friendly": ["budget", "budget-friendly", "Budget Friendly"],
  "All-Inclusive": ["all-inclusive", "All-Inclusive"],
  "Adventure": ["adventure", "Adventure"],
  "Family": ["family", "family-friendly", "Family"],
  "Solo Travel": ["solo", "solo-travel", "Solo Travel"],
  "Wellness": ["wellness", "spa", "retreat", "Wellness"],
  "Design-led": ["design", "design-led", "boutique", "Design-led"],
  "Eco-conscious": ["eco", "eco-conscious", "sustainable", "Eco-conscious"],
  "Adults only": ["adults-only", "adults only", "Adults only"],
  "City breaks": ["city", "city-break", "urban", "City breaks"],
};

export interface SearchFilters {
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  category?: string;
}

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const validTabs: Tab[] = ["trips", "trip-requests"];
  const rawTab = (searchParams.get("tab") as string) || "trips";
  const initialTab: Tab = validTabs.includes(rawTab as Tab) ? (rawTab as Tab) : "trips";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [filters, setFilters] = useState<SearchFilters>({
    destination: searchParams.get("destination") || "",
    travelers: parseInt(searchParams.get("travelers") || "1"),
  });

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("tab", activeTab);
    if (filters.destination) params.set("destination", filters.destination);
    if (filters.travelers && filters.travelers > 1) {
      params.set("travelers", filters.travelers.toString());
    }
    setSearchParams(params, { replace: true });
  }, [activeTab, filters, setSearchParams]);


  // Live Trips query
  const { data: liveTrips, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["marketplace-live-trips", filters.category],
    queryFn: async () => {
      let query = supabase
        .from("packaged_trips")
        .select(`
          id, slug, title, destination, cover_image_url, price_per_person, currency,
          duration_nights, highlights, creator_type,
          duration_days, max_participants, current_bookings, difficulty_level,
          rating, review_count, available_from, available_until, tags,
          creator:profiles!packaged_trips_creator_id_fkey(id, full_name, avatar_url)
        `)
        .eq("status", "published");

      // Apply category filter if selected (except "Top Rated" which is sort-only)
      if (filters.category && filters.category !== "Top Rated") {
        const tagVariants = FILTER_TAG_MAP[filters.category] || [filters.category.toLowerCase()];
        query = query.overlaps("tags", tagVariants);
      }

      // Sort: "Top Rated" by rating, otherwise by created_at
      if (filters.category === "Top Rated") {
        query = query.order("rating", { ascending: false, nullsFirst: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "trips",
  });


  const { data: tripRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["trip-requests-unified"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "trip-requests",
  });


  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    // Live Trips tab
    if (activeTab === "trips") {
      if (isLoadingTrips) {
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[420px] rounded-2xl" />
            ))}
          </div>
        );
      }
      if (!liveTrips?.length) {
        return (
          <EmptyState
            type="trips"
            onAction={() => navigate("/post-trip")}
          />
        );
      }
      return <LiveTripGrid trips={liveTrips as any} />;
    }

    if (activeTab === "trip-requests") {
      if (isLoadingRequests) {
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        );
      }
      if (!tripRequests?.length) {
        return (
          <EmptyState type="trip-requests" onAction={() => navigate("/post-trip")} />
        );
      }
      return <TripRequestGrid requests={tripRequests} />;
    }

    return null;
  };

  return (
    <>
      <Helmet>
        <title>The Collection · Goldsainte</title>
        <meta
          name="description"
          content="Browse curated trips, verified creators, certified agents, and traveler briefs. Book luxury experiences or post your dream trip."
        />
      </Helmet>

      <div className="min-h-screen bg-[#FDF9F0] pb-24 lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <BackButton className="mb-2" />
        </div>
        <MarketplaceHeader />
        <MarketplaceSearch onSearch={handleSearch} filters={filters} />

        <div className="mx-auto max-w-6xl px-4 py-4 md:py-8">
          {/* Mobile: Stack tabs and filters vertically */}
          <div className="mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <MarketplaceTabs activeTab={activeTab} onTabChange={handleTabChange} />
            <MarketplaceFilters filters={filters} onFilterChange={setFilters} />
          </div>

          {renderContent()}
        </div>
      </div>
    </>
  );
}
