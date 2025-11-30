import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Search, Users } from "lucide-react";
import TravelerDemandCard from "@/components/marketplace/TravelerDemandCard";

interface TravelerPreference {
  id: string;
  user_id: string;
  preferred_destinations: string[] | null;
  travel_style: string[] | null;
  budget_preference: string | null;
  trip_frequency: string | null;
  travel_companions: string | null;
  preferred_accommodation_types: string[] | null;
  created_at: string;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    home_base: string | null;
  } | null;
}

export default function TravelerDemandPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetFilter, setBudgetFilter] = useState<string>("all");
  const [styleFilter, setStyleFilter] = useState<string>("all");

  // Check if user is agent or creator
  const { data: profile } = useQuery({
    queryKey: ["profile-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth?returnTo=/traveler-demand");
      return;
    }
  }, [authLoading, user, navigate]);

  // Redirect non-agents/creators
  useEffect(() => {
    if (profile && !["agent", "creator"].includes(profile.account_type || "")) {
      navigate("/marketplace");
    }
  }, [profile, navigate]);

  const { data: travelers, isLoading } = useQuery({
    queryKey: ["discoverable-travelers", searchQuery, budgetFilter, styleFilter],
    queryFn: async () => {
      let query = supabase
        .from("user_travel_preferences")
        .select(`
          id,
          user_id,
          preferred_destinations,
          travel_style,
          budget_preference,
          trip_frequency,
          travel_companions,
          preferred_accommodation_types,
          created_at,
          profiles!inner(
            id,
            display_name,
            avatar_url,
            home_base
          )
        `)
        .eq("is_discoverable", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (budgetFilter && budgetFilter !== "all") {
        query = query.eq("budget_preference", budgetFilter);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching discoverable travelers:", error);
        return [];
      }

      // Client-side filtering for search and style
      let filtered = (data || []) as unknown as TravelerPreference[];

      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter((t) => {
          const destinations = t.preferred_destinations?.join(" ").toLowerCase() || "";
          const name = t.profiles?.display_name?.toLowerCase() || "";
          const homeBase = t.profiles?.home_base?.toLowerCase() || "";
          return destinations.includes(lowerQuery) || name.includes(lowerQuery) || homeBase.includes(lowerQuery);
        });
      }

      if (styleFilter && styleFilter !== "all") {
        filtered = filtered.filter((t) =>
          t.travel_style?.includes(styleFilter)
        );
      }

      return filtered;
    },
    enabled: !!user && profile?.account_type && ["agent", "creator"].includes(profile.account_type),
  });

  const handleCurateTrip = (userId: string) => {
    navigate(`/post-trip?for=${userId}`);
  };

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="w-20 h-[2px] bg-primary mx-auto mb-6" />
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="w-6 h-6 text-primary" />
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Traveler Demand
            </p>
          </div>
          <h1 className="font-secondary text-3xl sm:text-4xl md:text-5xl text-foreground mb-4">
            Travelers looking for their perfect trip
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Browse traveler preferences and proactively curate trips that match their dreams. 
            This is how you build your client base on Goldsainte.
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by destination, name, or home base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select value={budgetFilter} onValueChange={setBudgetFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-11">
              <SelectValue placeholder="Budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Budgets</SelectItem>
              <SelectItem value="Under $500">Under $500</SelectItem>
              <SelectItem value="$500–$1,000">$500–$1,000</SelectItem>
              <SelectItem value="$1,000–$3,000">$1,000–$3,000</SelectItem>
              <SelectItem value="$3,000–$5,000">$3,000–$5,000</SelectItem>
              <SelectItem value="$5,000+">$5,000+</SelectItem>
            </SelectContent>
          </Select>
          <Select value={styleFilter} onValueChange={setStyleFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-11">
              <SelectValue placeholder="Travel Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Styles</SelectItem>
              <SelectItem value="Leisure">Leisure</SelectItem>
              <SelectItem value="Adventure">Adventure</SelectItem>
              <SelectItem value="Cultural">Cultural</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
              <SelectItem value="Relaxation / Wellness">Wellness</SelectItem>
              <SelectItem value="Nature-focused">Nature</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            <p className="text-sm text-muted-foreground">
              Finding travelers who want trips curated for them…
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!travelers || travelers.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <Users className="w-12 h-12 text-muted-foreground/50" />
            <div>
              <h3 className="font-secondary text-xl text-foreground mb-2">
                No discoverable travelers yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Travelers who opt-in to discovery will appear here. 
                In the meantime, check the marketplace for active trip requests.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => navigate("/marketplace?tab=trip-requests")}
            >
              Browse trip requests
            </Button>
          </div>
        )}

        {/* Traveler Grid */}
        {!isLoading && travelers && travelers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {travelers.map((traveler) => (
              <TravelerDemandCard
                key={traveler.id}
                traveler={traveler}
                onCurateTrip={() => handleCurateTrip(traveler.user_id)}
              />
            ))}
          </div>
        )}

        {/* Results count */}
        {!isLoading && travelers && travelers.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-8">
            Showing {travelers.length} discoverable traveler{travelers.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
