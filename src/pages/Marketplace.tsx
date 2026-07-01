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
import { LiveSignalRow } from "@/components/marketplace/LiveSignalRow";
import { QuietlyActiveFooter } from "@/components/marketplace/QuietlyActiveFooter";
import { ForYouRow } from "@/components/marketplace/ForYouRow";
import { AdaptiveCollectionRow } from "@/components/marketplace/AdaptiveCollectionRow";
import { ThisWeekFooter } from "@/components/marketplace/ThisWeekFooter";
import { ItineraryGuideCard } from "@/components/marketplace/ItineraryGuideCard";
import { BundleCard } from "@/components/marketplace/BundleCard";
import { BookOpen, Search } from "lucide-react";

type Tab = "trips" | "trip-requests" | "itinerary-guides" | "bundles";

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

  // Mark marketplace as visited for the Getting Started checklist
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`visited_marketplace_${user.id}`, "true");
    }
  }, [user?.id]);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();

  const validTabs: Tab[] = ["trips", "trip-requests", "itinerary-guides", "bundles"];
  const rawTab = (searchParams.get("tab") as string) || "trips";
  const initialTab: Tab = validTabs.includes(rawTab as Tab) ? (rawTab as Tab) : "trips";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [guideSearch, setGuideSearch] = useState("");
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
    queryKey: ["marketplace-live-trips", filters.category, filters.destination, filters.startDate, filters.endDate, filters.travelers, filters.sortBy, filters.minPrice, filters.maxPrice],
    queryFn: async () => {
      let query = supabase
        .from("packaged_trips")
        .select(`
          id, slug, title, destination, cover_image_url, price_per_person, currency,
          duration_nights, highlights, creator_type,
          duration_days, max_participants, current_bookings, difficulty_level,
          rating, review_count, available_from, available_until, tags,
          wishlist_count, booking_count, view_count, is_verified, created_at,
          creator:profiles!packaged_trips_creator_id_fkey(id, full_name, avatar_url, home_base, content_style_tags, is_verified)
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
        creator:profiles!packaged_trips_creator_id_fkey(id, full_name, avatar_url, home_base, content_style_tags, is_verified)
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
    const combined = liveTrips ? [...liveTrips, ...extraTrips] : [];
    const min = filters.minPrice ?? 0;
    const max = filters.maxPrice ?? 10000;
    return combined.filter((t) => {
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

  // Itinerary guides query
  const { data: itineraryGuides, isLoading: isLoadingGuides } = useQuery({
    queryKey: ["marketplace-itinerary-guides"],
    enabled: activeTab === "itinerary-guides",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("itinerary_products")
        .select(`
          id, creator_id, title, destination, duration_days, price, currency,
          cover_image_url, description, created_at, status
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data || [];
      const creatorIds = [...new Set(rows.map((r: any) => r.creator_id).filter(Boolean))];
      const { data: profiles } = creatorIds.length
        ? await supabase.from("profiles").select("id, full_name, avatar_url, username").in("id", creatorIds)
        : { data: [] as any[] };
      const map = new Map((profiles || []).map((p: any) => [p.id, p]));
      return rows.map((r: any) => ({ ...r, creator: map.get(r.creator_id) || null }));
    },
  });

  const filteredGuides = (itineraryGuides || []).filter((g: any) =>
    !guideSearch ||
    g.destination?.toLowerCase().includes(guideSearch.toLowerCase()) ||
    g.title?.toLowerCase().includes(guideSearch.toLowerCase())
  );

  const { data: bundles, isLoading: isLoadingBundles } = useQuery({
    queryKey: ["product-bundles-marketplace"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_bundles")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data || [];
      const creatorIds = [...new Set(rows.map((r: any) => r.creator_id).filter(Boolean))];
      const { data: profiles } = creatorIds.length
        ? await supabase.from("profiles").select("id, full_name, username").in("id", creatorIds)
        : { data: [] as any[] };
      const map = new Map((profiles || []).map((p: any) => [p.id, p]));
      return rows.map((r: any) => ({ ...r, creator: map.get(r.creator_id) || null }));
    },
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
          <div className="grid gap-x-4 gap-y-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
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
            <p className="text-xs text-[#9A9384] mt-2">If the problem persists, try refreshing the page.</p>
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
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton className="h-5 w-4/5 rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-4 w-1/3 rounded" />
              </div>
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

    if (activeTab === "itinerary-guides") {
      if (isLoadingGuides) {
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton className="h-5 w-4/5 rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-4 w-1/3 rounded" />
              </div>
            ))}
          </div>
        );
      }
      if (!filteredGuides.length) {
        return (
          <div className="py-16 text-center">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-[#C7A962]" />
            <h3 className="font-secondary text-xl text-[#0a2225]">No guides yet</h3>
            <p className="mt-2 text-sm text-[#6B7280]">
              Travel creators and agents are publishing new itinerary guides. Check back soon.
            </p>
          </div>
        );
      }
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredGuides.map((guide: any) => (
            <ItineraryGuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      );
    }

    if (activeTab === "bundles") {
      if (isLoadingBundles) {
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-2xl" />
            ))}
          </div>
        );
      }
      if (!bundles?.length) {
        return (
          <div className="py-16 text-center">
            <h3 className="font-secondary text-xl text-[#0a2225]">No bundles yet</h3>
            <p className="mt-2 text-sm text-[#6B7280]">
              Creators are crafting curated bundles. Check back soon.
            </p>
          </div>
        );
      }
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bundles.map((b: any) => (
            <BundleCard key={b.id} bundle={b} />
          ))}
        </div>
      );
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
          {activeTab === "trips" && <LiveSignalRow />}
          <div className="mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-start">
            <div className="flex-1 min-w-0">
              <MarketplaceTabs activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            {activeTab !== "itinerary-guides" && (
              <div className="md:shrink-0 md:w-[200px]">
                <MarketplaceFilters filters={filters} onFilterChange={setFilters} />
              </div>
            )}
          </div>

          {activeTab === "trips" && <ForYouRow />}

          {activeTab === "itinerary-guides" && (
            <div className="mb-6 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A7151]" />
                <input
                  type="text"
                  placeholder="Search by destination or title…"
                  value={guideSearch}
                  onChange={(e) => setGuideSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E5DFC6] bg-white text-sm focus:outline-none focus:border-[#C7A962] text-[#0a2225]"
                />
              </div>
            </div>
          )}

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
