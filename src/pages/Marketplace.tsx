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
import { BrandEmptyState } from "@/components/brand/BrandEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type Tab = "creators" | "agents" | "brands" | "trip-requests";

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
    ? ["creators", "agents", "brands"]
    : ["creators", "agents", "brands", "trip-requests"];
  
  const rawTab = (searchParams.get("tab") as string) || (isTraveler ? "creators" : "trip-requests");
  
  // Redirect travelers away from trip-requests tab
  const initialTab: Tab = validTabs.includes(rawTab as Tab)
    ? (rawTab as Tab)
    : (isTraveler ? "creators" : "trip-requests");

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


  const { data: creators, isLoading: isLoadingCreators } = useQuery({
    queryKey: ["marketplace-creators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,username,avatar_url,bio")
        .eq("account_type", "creator");

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

      <div className="min-h-screen bg-[#f7f3ea]">
        <MarketplaceHeader />
        <MarketplaceSearch onSearch={handleSearch} filters={filters} />

        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <MarketplaceTabs activeTab={activeTab} onTabChange={handleTabChange} accountType={accountType} />
            <MarketplaceFilters filters={filters} onFilterChange={setFilters} />
          </div>

          {renderContent()}
        </div>
      </div>
    </>
  );
}
