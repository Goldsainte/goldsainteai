import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { MarketplaceTabs } from "@/components/marketplace/MarketplaceTabs";
import { TripGrid } from "@/components/marketplace/TripGrid";
import { CreatorGrid } from "@/components/marketplace/CreatorGrid";
import { AgentGrid } from "@/components/marketplace/AgentGrid";
import { TripRequestGrid } from "@/components/marketplace/TripRequestGrid";
import { BrandGrid } from "@/components/marketplace/BrandGrid";
import { LiveTripGrid } from "@/components/marketplace/LiveTripGrid";
import type { BrandSummary } from "@/components/marketplace/BrandCard";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { BrandEmptyState } from "@/components/brand/BrandEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { useQuery } from "@tanstack/react-query";

type Tab = "trips" | "creators" | "agents" | "brands" | "trip-requests";

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
  
  // Extract account type to gate Trip Requests tab
  const accountType = 
    ((user as any)?.user_metadata?.account_type as string | undefined)?.toLowerCase() ?? null;
  const isTraveler = !accountType || accountType === "traveler";

  // Travelers cannot see trip-requests tab
  const validTabs: Tab[] = isTraveler 
    ? ["trips", "creators", "agents", "brands"]
    : ["trips", "creators", "agents", "brands", "trip-requests"];
  
  const rawTab = (searchParams.get("tab") as string) || "trips";
  
  // Redirect travelers away from trip-requests tab
  const initialTab: Tab = validTabs.includes(rawTab as Tab)
    ? (rawTab as Tab)
    : "trips";

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

  const { data: creators, isLoading: isLoadingCreators } = useQuery({
    queryKey: ["marketplace-creators", filters.category],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id,full_name,username,avatar_url,bio,creator_niches")
        .eq("account_type", "creator");

      // Apply category filter using creator_niches
      if (filters.category && filters.category !== "Top Rated") {
        const tagVariants = FILTER_TAG_MAP[filters.category] || [filters.category.toLowerCase()];
        query = query.overlaps("creator_niches", tagVariants);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "creators",
  });

  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["marketplace-agents", filters.category],
    queryFn: async () => {
      let query = supabase
        .from("travel_agents")
        .select("*")
        .eq("is_active", true);

      // Apply category filter using specializations
      if (filters.category && filters.category !== "Top Rated") {
        const tagVariants = FILTER_TAG_MAP[filters.category] || [filters.category.toLowerCase()];
        query = query.overlaps("specializations", tagVariants);
      }

      // Sort by rating
      query = query.order("rating", { ascending: false, nullsFirst: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "agents",
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

  const { data: brands, isLoading: isLoadingBrands } = useQuery<BrandSummary[]>({
    queryKey: ["marketplace-brands", user?.id],
    queryFn: async () => {
      // Personalized results for logged-in users
      if (user?.id) {
        const { data, error } = await invokeWithAuth<{ matches: any[] }>("ai-brand-discovery", {
          body: { userId: user.id },
        });

        if (error) throw new Error(error);

        const matches = (data?.matches || []) as any[];

        return matches.map((b: any) => ({
          profile_id: b.profile_id,
          name: b.name,
          avatar_url: b.avatar_url,
          cover_image_url: b.cover_image_url,
          bio: b.bio,
          brand_type: b.brand_type,
          categories: b.categories,
          regions: b.regions,
          supplier_type: b.supplier_type,
          supplier_rating: b.supplier_rating,
          supplier_reviews: b.supplier_reviews,
          match_score: b.match_score,
        }));
      }

      // Basic results for guests - query view directly
      const { data, error } = await supabase
        .from("brand_profiles_discovery")
        .select("profile_id, name, avatar_url, cover_image_url, bio, brand_type, categories, regions, supplier_rating, supplier_reviews")
        .order("supplier_rating", { ascending: false, nullsFirst: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((b: any) => ({
        profile_id: b.profile_id,
        name: b.name,
        avatar_url: b.avatar_url,
        cover_image_url: b.cover_image_url,
        bio: b.bio,
        brand_type: b.brand_type,
        categories: b.categories,
        regions: b.regions,
        supplier_type: null,
        supplier_rating: b.supplier_rating,
        supplier_reviews: b.supplier_reviews,
        match_score: null,
      }));
    },
    enabled: activeTab === "brands",
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

    if (activeTab === "creators") {
      if (isLoadingCreators) {
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        );
      }
      if (!creators?.length) {
        return <EmptyState type="creators" onAction={() => navigate("/creators")} />;
      }
      return <CreatorGrid creators={creators} />;
    }

    if (activeTab === "agents") {
      if (isLoadingAgents) {
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        );
      }
      if (!agents?.length) {
        return <EmptyState type="agents" onAction={() => navigate("/browse-agents")} />;
      }
      return <AgentGrid agents={agents} />;
    }

    if (activeTab === "brands") {
      if (isLoadingBrands) {
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        );
      }

      if (!brands?.length) {
        return <BrandEmptyState />;
      }

      return <BrandGrid brands={brands} />;
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
        <title>Marketplace · Goldsainte</title>
        <meta
          name="description"
          content="Browse curated trips, verified creators, certified agents, and traveler briefs. Book luxury experiences or post your dream trip."
        />
      </Helmet>

      <div className="min-h-screen bg-[#FDF9F0] pb-24 lg:pb-0">
        <MarketplaceHeader />
        <MarketplaceSearch onSearch={handleSearch} filters={filters} />

        <div className="mx-auto max-w-6xl px-4 py-4 md:py-8">
          {/* Mobile: Stack tabs and filters vertically */}
          <div className="mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <MarketplaceTabs activeTab={activeTab} onTabChange={handleTabChange} accountType={accountType} />
            <MarketplaceFilters filters={filters} onFilterChange={setFilters} />
          </div>

          {renderContent()}
        </div>
      </div>
    </>
  );
}
