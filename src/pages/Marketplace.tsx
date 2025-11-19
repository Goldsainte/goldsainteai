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
import type { BrandSummary } from "@/components/marketplace/BrandCard";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type Tab = "trips" | "creators" | "agents" | "brands" | "trip-requests";

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
  
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) || "trips"
  );
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

  const { data: trips, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["marketplace-trips", filters],
    queryFn: async () => {
      let query = supabase
        .from("packaged_trips")
        .select(`
          *,
          profiles:creator_id(full_name,username),
          travel_agents:agent_id(agency_name)
        `)
        .eq("status", "published");

      if (filters.destination) {
        query = query.or(
          `destination.ilike.%${filters.destination}%,title.ilike.%${filters.destination}%`
        );
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      return data?.map((trip: any) => ({
        id: trip.id,
        title: trip.title,
        slug: trip.slug,
        destination: trip.destination,
        cover_image_url: trip.cover_image_url,
        price_per_person: trip.price_per_person,
        currency: trip.currency,
        duration_days: trip.duration_days,
        rating: trip.rating,
        review_count: trip.review_count,
        tags: trip.tags || [],
        creator_name:
          trip.travel_agents?.agency_name ||
          trip.profiles?.full_name ||
          trip.profiles?.username,
        is_verified: trip.is_verified,
        max_participants: trip.max_participants,
      })) || [];
    },
    enabled: activeTab === "trips",
  });

  const { data: creators, isLoading: isLoadingCreators } = useQuery({
    queryKey: ["marketplace-creators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,username,avatar_url,bio")
        .eq("role", "creator");

      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "creators",
  });

  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["marketplace-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("travel_agents")
        .select("*")
        .eq("is_active", true)
        .order("rating", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "agents",
  });

  const { data: tripRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["marketplace-trip-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_jobs")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "trip-requests",
  });

  const { data: brands, isLoading: isLoadingBrands } = useQuery<BrandSummary[]>({
    queryKey: ["marketplace-brands"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-brand-discovery", {
        body: { userId: user?.id },
      });

      if (error) throw error;

      const matches = (data?.matches || []) as any[];

      return matches.map((b: any) => ({
        profile_id: b.profile_id,
        name: b.name,
        avatar_url: b.avatar_url,
        bio: b.bio,
        categories: b.categories,
        regions: b.regions,
        supplier_type: b.supplier_type,
        supplier_rating: b.supplier_rating,
        supplier_reviews: b.supplier_reviews,
        match_score: b.match_score,
      }));
    },
    enabled: activeTab === "brands" && !!user,
  });

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
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
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        );
      }
      if (!trips?.length) {
        return <EmptyState type="trips" onAction={() => navigate("/post-trip")} />;
      }
      return <TripGrid trips={trips} />;
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
        return (
          <EmptyState
            type="agents"
            onAction={() => navigate("/marketplace")}
          />
        );
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

      <div className="min-h-screen bg-[#f7f3ea]">
        <MarketplaceHeader />
        <MarketplaceSearch onSearch={handleSearch} filters={filters} />

        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <MarketplaceTabs activeTab={activeTab} onTabChange={handleTabChange} />
            <MarketplaceFilters filters={filters} onFilterChange={setFilters} />
          </div>

          {renderContent()}
        </div>
      </div>
    </>
  );
}
