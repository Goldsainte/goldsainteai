import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MarketplaceHero, SearchFilters } from "@/components/marketplace/MarketplaceHero";
import { TripCard } from "@/components/marketplace/TripCard";
import { CreatorCard } from "@/components/marketplace/CreatorCard";
import { AgentCard } from "@/components/marketplace/AgentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ComprehensiveJobForm } from "@/components/ComprehensiveJobForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Briefcase, DollarSign } from "lucide-react";
import { toast } from "sonner";

type Tab = "trips" | "creators" | "agents" | "requests";

export default function Marketplace() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) || "trips"
  );
  const [filters, setFilters] = useState<SearchFilters>({
    destination: searchParams.get("destination") || "",
    travelers: parseInt(searchParams.get("travelers") || "1"),
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(
    searchParams.get("create") === "true"
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("tab", activeTab);
    if (filters.destination) params.set("destination", filters.destination);
    if (filters.travelers > 1) params.set("travelers", filters.travelers.toString());
    setSearchParams(params, { replace: true });
  }, [activeTab, filters, setSearchParams]);

  const { data: trips, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["packaged-trips", filters],
    queryFn: async () => {
      let query = supabase
        .from("packaged_trips")
        .select(`*,profiles:creator_id(full_name,username),travel_agents:agent_id(agency_name)`)
        .eq("status", "published");

      if (filters.destination) {
        query = query.or(`destination.ilike.%${filters.destination}%,title.ilike.%${filters.destination}%`);
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
        creator_name: trip.travel_agents?.agency_name || trip.profiles?.full_name || trip.profiles?.username,
        is_verified: trip.is_verified,
        max_participants: trip.max_participants,
      })) || [];
    },
    enabled: activeTab === "trips",
  });

  const { data: creators, isLoading: isLoadingCreators } = useQuery({
    queryKey: ["creators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("travel_posts")
        .select(`user_id,view_count,location,profiles:user_id(id,full_name,username,avatar_url,bio,identity_verified)`)
        .eq("status", "active");

      if (error) throw error;

      const creatorMap = new Map();
      data?.forEach((post: any) => {
        if (!post.profiles) return;
        const userId = post.user_id;
        if (!creatorMap.has(userId)) {
          creatorMap.set(userId, {
            id: userId,
            ...post.profiles,
            stats: { trips_created: 0, avg_views: 0, total_views: 0 },
            specialties: new Set(),
          });
        }
        const creator = creatorMap.get(userId);
        creator.stats.trips_created += 1;
        creator.stats.total_views += post.view_count || 0;
        if (post.location) creator.specialties.add(post.location);
      });

      return Array.from(creatorMap.values()).map((c: any) => ({
        ...c,
        stats: { ...c.stats, avg_views: Math.round(c.stats.total_views / (c.stats.trips_created || 1)) },
        specialties: Array.from(c.specialties).slice(0, 4),
      })).filter((c: any) => c.stats.trips_created > 0);
    },
    enabled: activeTab === "creators",
  });

  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("travel_agents").select("*").eq("is_active", true).order("rating", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "agents",
  });

  const { data: requests, isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ["marketplace-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketplace_jobs").select(`*,profiles:user_id(full_name,avatar_url)`).eq("status", "open").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "requests",
  });

  const handleSearch = (newFilters: SearchFilters) => setFilters(newFilters);
  const handleTabChange = (tab: Tab) => setActiveTab(tab);
  const handleJobCreated = () => { toast.success("Trip request posted!"); setIsCreateDialogOpen(false); refetchRequests(); };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHero onSearch={handleSearch} activeTab={activeTab} />
      <section className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="inline-flex rounded-full bg-muted p-1">
            {(["trips", "creators", "agents", "requests"] as Tab[]).map(tab => (
              <button key={tab} onClick={() => handleTabChange(tab)} className={`rounded-full px-5 py-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {tab === "requests" ? "Trip Requests" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "trips" && (isLoadingTrips ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96" />)}</div> : trips?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{trips.map((t: any) => <TripCard key={t.id} trip={t} />)}</div> : <div className="text-center py-20"><p>No trips found</p></div>)}
        {activeTab === "creators" && (isLoadingCreators ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96" />)}</div> : creators?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{creators.map((c: any) => <CreatorCard key={c.id} creator={c} />)}</div> : <div className="text-center py-20"><p>No creators found</p></div>)}
        {activeTab === "agents" && (isLoadingAgents ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96" />)}</div> : agents?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{agents.map((a: any) => <AgentCard key={a.id} agent={a} />)}</div> : <div className="text-center py-20"><p>No agents found</p></div>)}
        {activeTab === "requests" && (isLoadingRequests ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}</div> : requests?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{requests.map((r: any) => <Card key={r.id} className="cursor-pointer hover:shadow-lg" onClick={() => navigate(`/marketplace/request/${r.id}`)}><CardHeader><CardTitle>{r.title}</CardTitle><CardDescription><MapPin className="inline h-3 w-3 mr-1"/>{r.destination}</CardDescription></CardHeader><CardContent><p className="text-sm line-clamp-2">{r.description}</p></CardContent></Card>)}</div> : <div className="text-center py-20"><p>No requests found</p><Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">Post a Trip Request</Button></div>)}
      </section>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><ComprehensiveJobForm onJobCreated={handleJobCreated} /></DialogContent></Dialog>
    </div>
  );
}
