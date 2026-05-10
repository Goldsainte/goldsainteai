import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { MarketplaceTabs } from "@/components/marketplace/MarketplaceTabs";
import { LiveTripGrid } from "@/components/marketplace/LiveTripGrid";
import { TripRequestGrid } from "@/components/marketplace/TripRequestGrid";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BackButton } from "@/components/ui/BackButton";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { CategoryChips } from "@/components/ui/CategoryChips";
import { LiveSignalRow } from "@/components/marketplace/LiveSignalRow";
import { QuietlyActiveFooter } from "@/components/marketplace/QuietlyActiveFooter";
import { ForYouRow } from "@/components/marketplace/ForYouRow";
import { AdaptiveCollectionRow } from "@/components/marketplace/AdaptiveCollectionRow";
import { ThisWeekFooter } from "@/components/marketplace/ThisWeekFooter";

type Tab = "trips" | "trip-requests";

const FILTER_TAG_MAP: Record<string, string[]> = {
  "Bucket List": ["bucket-list", "bucket list", "once-in-a-lifetime", "iconic", "wonder"],
  "Luxury Escapes": ["luxury", "high-end", "premium", "exclusive", "villa", "five-star"],
  "Food & Culture": ["food", "culinary", "culture", "gastronomy", "cuisine", "dining", "heritage"],
  "Wellness & Reset": ["wellness", "spa", "retreat", "yoga", "meditation", "detox"],
  "Group Trips": ["group", "friends", "team", "party", "family-friendly", "family"],
  "Romantic Getaways": ["romantic", "honeymoon", "couples", "romance", "intimate"],
  "Solo Travel": ["solo", "solo-travel", "independent", "backpacking"],
  "Cinematic Destinations": ["cinematic", "scenic", "photogenic", "dramatic", "views"],
  "City Energy": ["city", "urban", "nightlife", "metropolitan", "city-break"],
  "Nature & Adventure": ["nature", "adventure", "hiking", "trek", "safari", "mountain", "wildlife", "outdoor"],
  "Top Rated": [],
};

export interface SearchFilters {
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "newest" | "top-rated" | "price-low" | "price-high";
}

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();

  const validTabs: Tab[] = ["trips", "trip-requests"];
  const rawTab = (searchParams.get("tab") as string) || "trips";
  const initialTab: Tab = validTabs.includes(rawTab as Tab) ? (rawTab as Tab) : "trips";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [filters, setFilters] = useState<SearchFilters>({
    destination: searchParams.get("destination") || "",
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    travelers: parseInt(searchParams.get("travelers") || "1") || 1,
  });

  // Persist filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("tab", activeTab);
    if (filters.destination) params.set("destination", filters.destination);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.travelers && filters.travelers > 1) params.set("travelers", filters.travelers.toString());
    setSearchParams(params, { replace: true });
  }, [activeTab, filters, setSearchParams]);

  const hasActiveFilters = !!(
    filters.destination ||
    filters.startDate ||
    filters.endDate ||
    (filters.travelers && filters.travelers > 1)
  );

  const handleClearFilters = () => {
    setFilters({ destination: "", travelers: 1 });
    setOffset(0);
    setExtraTrips([]);
  };

  // Pagination state for live trips
  const [offset, setOffset] = useState(0);
  const [extraTrips, setExtraTrips] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
    setExtraTrips([]);
    setReachedEnd(false);
  }, [filters.category, filters.destination, filters.startDate, filters.endDate, filters.travelers, filters.sortBy]);

  // Live Trips query — wired with search filters
  const { data: liveTrips, isLoading: isLoadingTrips, isError: isTripsError, refetch: refetchTrips } = useQuery({
    queryKey: ["marketplace-live-trips", filters.category, filters.destination, filters.startDate, filters.endDate, filters.travelers, filters.sortBy],
    queryFn: async () => {
      let query = supabase
        .from("packaged_trips")
        .select(`
          id, slug, title, destination, cover_image_url, price_per_person, currency,
          duration_nights, highlights, creator_type,
          duration_days, max_participants, current_bookings, difficulty_level,
          rating, review_count, available_from, available_until, tags,
          wishlist_count, booking_count, view_count, is_verified, created_at,
          creator:profiles!left(id, full_name, avatar_url, home_base, content_style_tags, is_verified)
        `)
        .eq("status", "published");

      // Destination filter
      if (filters.destination) {
        query = query.ilike("destination", `%${filters.destination}%`);
      }

      // Date filters: trip must overlap with requested range
      if (filters.startDate) {
        query = query.gte("available_until", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("available_from", filters.endDate);
      }

      // Travelers capacity
      if (filters.travelers && filters.travelers > 1) {
        query = query.gte("max_participants", filters.travelers);
      }

      // Price range
      if (filters.minPrice && filters.minPrice > 0) {
        query = query.gte("price_per_person", filters.minPrice);
      }
      if (filters.maxPrice && filters.maxPrice < 10000) {
        query = query.lte("price_per_person", filters.maxPrice);
      }

      // Category tag filter
      if (filters.category && filters.category !== "Top Rated") {
        const tagVariants = FILTER_TAG_MAP[filters.category] || [filters.category.toLowerCase()];
        query = query.overlaps("tags", tagVariants);
      }

      // Sort
      if (filters.sortBy === "top-rated" || filters.category === "Top Rated") {
        query = query.order("rating", { ascending: false, nullsFirst: false });
      } else if (filters.sortBy === "price-low") {
        query = query.order("price_per_person", { ascending: true, nullsFirst: false });
      } else if (filters.sortBy === "price-high") {
        query = query.order("price_per_person", { ascending: false, nullsFirst: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query.limit(48);
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "trips",
  });

  const buildLiveTripsQuery = () => {
    let query = supabase
      .from("packaged_trips")
      .select(`
        id, slug, title, destination, cover_image_url, price_per_person, currency,
        duration_nights, highlights, creator_type,
        duration_days, max_participants, current_bookings, difficulty_level,
        rating, review_count, available_from, available_until, tags,
        wishlist_count, booking_count, view_count, is_verified, created_at,
        creator:profiles!left(id, full_name, avatar_url, home_base, content_style_tags, is_verified)
      `)
      .eq("status", "published");
    if (filters.destination) query = query.ilike("destination", `%${filters.destination}%`);
    if (filters.startDate) query = query.gte("available_until", filters.startDate);
    if (filters.endDate) query = query.lte("available_from", filters.endDate);
    if (filters.travelers && filters.travelers > 1) query = query.gte("max_participants", filters.travelers);
    if (filters.category && filters.category !== "Top Rated") {
      const tagVariants = FILTER_TAG_MAP[filters.category] || [filters.category.toLowerCase()];
      query = query.overlaps("tags", tagVariants);
    }
    if (filters.sortBy === "top-rated" || filters.category === "Top Rated") {
      query = query.order("rating", { ascending: false, nullsFirst: false });
    } else if (filters.sortBy === "price-low") {
      query = query.order("price_per_person", { ascending: true, nullsFirst: false });
    } else if (filters.sortBy === "price-high") {
      query = query.order("price_per_person", { ascending: false, nullsFirst: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }
    return query;
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const nextOffset = (offset || 48) + (offset === 0 ? 0 : 48);
      const start = (liveTrips?.length || 0) + extraTrips.length;
      const end = start + 47;
      const { data, error } = await buildLiveTripsQuery().range(start, end);
      if (error) throw error;
      const rows = data || [];
      if (rows.length < 48) setReachedEnd(true);
      setExtraTrips((prev) => [...prev, ...rows]);
      setOffset(start + rows.length);
    } catch (e) {
      toast.error("Failed to load more trips");
    } finally {
      setLoadingMore(false);
    }
  };

  // Client-side price filter on liveTrips
  const filteredLiveTrips = useMemo(() => {
    const combined = liveTrips ? [...liveTrips, ...extraTrips] : null;
    if (!combined) return combined;
    const min = filters.minPrice ?? 0;
    const max = filters.maxPrice ?? 10000;
    return (combined as any[]).filter((t) => {
      const p = t.price_per_person ?? 0;
      return p >= min && p <= max;
    });
  }, [liveTrips, extraTrips, filters.minPrice, filters.maxPrice]);

  // Trip Requests query — wired with search filters
  const { data: tripRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["trip-requests-unified", filters.destination, filters.startDate, filters.endDate, filters.travelers],
    queryFn: async () => {
      let query = supabase
        .from("trip_requests")
        .select(`*, trip_proposals(count)`)
        .eq("status", "open");

      // Destination filter
      if (filters.destination) {
        query = query.ilike("destination", `%${filters.destination}%`);
      }

      // Date overlap: request overlaps with search range
      if (filters.startDate) {
        query = query.gte("end_date", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("start_date", filters.endDate);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Client-side traveler filter
      let filtered = data;
      if (filters.travelers && filters.travelers > 1) {
        filtered = data.filter((r: any) => {
          const total = (r.travelers_adults || 0) + (r.travelers_children || 0);
          return total >= filters.travelers!;
        });
      }

      // Fetch profiles
      const userIds = [...new Set(filtered.map((r: any) => r.user_id).filter(Boolean))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      return filtered.map((r: any) => ({
        ...r,
        profiles: profileMap.get(r.user_id) || null,
        proposal_count: r.trip_proposals?.[0]?.count || 0,
      }));
    },
    enabled: activeTab === "trip-requests",
  });

  const handleDeleteRequest = async (id: string) => {
    const { error } = await supabase.from("trip_requests").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete trip request");
      return;
    }
    toast.success("Trip request deleted");
    queryClient.invalidateQueries({ queryKey: ["trip-requests-unified"] });
  };

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
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
      if (isTripsError) {
        return (
          <div className="py-16 text-center">
            <p className="text-[#0a2225] mb-4">
              We had trouble loading trips. Please refresh or try again.
            </p>
            <Button onClick={() => refetchTrips()} className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6]">
              Retry
            </Button>
          </div>
        );
      }
      if (!filteredLiveTrips?.length) {
        return (
          <EmptyState
            type="trips"
            onAction={() => navigate("/post-trip")}
            hasFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        );
      }
      const showLoadMore = !reachedEnd && (liveTrips?.length || 0) + extraTrips.length >= 48;
      return (
        <>
          <LiveTripGrid trips={filteredLiveTrips as any} />
          {showLoadMore && (
            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="rounded-full border-[#0c4d47] text-[#0c4d47] hover:bg-[#0c4d47] hover:text-[#E5DFC6]"
              >
                {loadingMore ? "Loading…" : "Load More"}
              </Button>
            </div>
          )}
        </>
      );
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
          <EmptyState
            type="trip-requests"
            onAction={() => navigate("/post-trip")}
            hasFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        );
      }
      return <TripRequestGrid requests={tripRequests} isAdmin={isAdmin} onDelete={handleDeleteRequest} />;
    }

    return null;
  };

  return (
    <>
      <Helmet>
        <title>Travel Marketplace — Goldsainte</title>
        <meta
          name="description"
          content="Browse handpicked trips from certified travel specialists and travel creators across 50+ countries. Book instantly or post your dream trip and receive custom proposals."
        />
      </Helmet>

      <div className="min-h-screen bg-[#FDF9F0] pb-24 lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <BackButton className="mb-2" />
        </div>
        <MarketplaceHeader />
        <MarketplaceSearch onSearch={handleSearch} filters={filters} onClearFilters={handleClearFilters} />

        <div className="mx-auto max-w-6xl px-4 py-4 md:py-8">
          {/* Category discovery chips */}
          <CategoryChips
            activeCategory={filters.category || "All"}
            onCategoryChange={(cat) => {
              const CATEGORY_TO_FILTER: Record<string, string> = {
                "Luxury Escapes": "Luxury",
                "Solo Travel": "Solo Travel",
                "City Energy": "City breaks",
                "Nature & Adventure": "Adventure",
                "Wellness & Reset": "Wellness",
                "Group Trips": "Family",
                "Food & Culture": "Design-led",
              };
              setFilters((prev) => ({
                ...prev,
                category: cat === "All" ? undefined : (CATEGORY_TO_FILTER[cat] || cat),
              }));
            }}
            className="mb-4"
          />
          {activeTab === "trips" && <LiveSignalRow />}
          <div className="mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <MarketplaceTabs activeTab={activeTab} onTabChange={handleTabChange} />
            <MarketplaceFilters filters={filters} onFilterChange={setFilters} />
          </div>

          {activeTab === "trips" && <ForYouRow />}

          {renderContent()}

          {activeTab === "trips" && (
            <>
              <AdaptiveCollectionRow
                title="Slow Luxury"
                kicker="A quieter way"
                tags={["wellness", "Wellness", "luxury", "Luxury", "spa"]}
              />
              <AdaptiveCollectionRow
                title="Hidden Cities"
                kicker="Off the obvious"
                tags={["city", "City breaks", "design-led", "Design-led", "boutique"]}
              />
              <AdaptiveCollectionRow
                title="Quiet Adventure"
                kicker="Earned solitude"
                tags={["adventure", "Adventure", "nature", "eco-conscious"]}
              />
              <ThisWeekFooter />
            </>
          )}

          {activeTab === "trips" && <QuietlyActiveFooter />}
        </div>
      </div>
    </>
  );
}
