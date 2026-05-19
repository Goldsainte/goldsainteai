import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, Calendar, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ItineraryDetailDialog } from "@/components/collections/ItineraryDetailDialog";
import { BackButton } from "@/components/ui/BackButton";
import { CollectionsLoadingSkeleton } from "@/components/collections/CollectionsLoadingSkeleton";

interface CuratedItinerary {
  id: string;
  title: string;
  heroImageUrl: string;
  primaryDestination: string;
  vibeTags: string[];
  durationNights: number;
  headline: string;
  budgetRange?: string;
}

export default function CollectionsPage() {
  const { user } = useAuth();
  const [itineraries, setItineraries] = useState<CuratedItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [selectedItinerary, setSelectedItinerary] = useState<CuratedItinerary | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wasCached, setWasCached] = useState(false);

  // Route guard: redirect non-travelers away from Collections
  const accountType = (user as any)?.user_metadata?.account_type?.toLowerCase();
  if (accountType === 'creator' || accountType === 'agent' || accountType === 'brand') {
    return <Navigate to="/partner" replace />;
  }

  const loadCollections = async (isRefresh = false) => {
    if (!user) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // First load user preferences for context display
      const { data: prefsData } = await supabase
        .from("user_travel_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setPreferences(prefsData);

      // Call the edge function to get AI-curated itineraries
      // Pass forceRefresh: true when user manually refreshes
      const { data, error } = await supabase.functions.invoke("curated-itineraries", {
        body: { userId: user.id, count: 12, forceRefresh: isRefresh },
      });

      if (error) {
        console.error("Error loading curated itineraries", error);
        toast.error("Could not load your personalized collections");
        return;
      }

      setItineraries(data?.itineraries || []);
      setWasCached(data?.cached || false);
      
      if (isRefresh && !data?.cached) {
        toast.success("Collections refreshed with your latest activity");
      }
    } catch (err) {
      console.error("Error in loadCollections:", err);
      toast.error("Something went wrong loading collections");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCollections();
    }
  }, [user]);

  const handleRefresh = () => {
    loadCollections(true);
  };

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      <div className="container px-4 py-6 sm:py-10 max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton label="Back" />
        </div>
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-0.5 bg-[#C7A962] mx-auto mb-6" />
          <h1 className="font-secondary text-3xl sm:text-4xl md:text-5xl text-[#0a2225] mb-4">
            Collections tailored to your travel signature
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Based on how you like to travel, we've curated itineraries from around the world 
            that match your style, pace, and preferences.
          </p>
          
          {/* Preference summary pills */}
          {preferences && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {preferences.travel_style?.slice(0, 3).map((style: string) => (
                <Badge 
                  key={style} 
                  variant="outline" 
                  className="rounded-full text-[10px] uppercase tracking-wide bg-white/60 border-[#E5DFC6]"
                >
                  {style}
                </Badge>
              ))}
              {preferences.budget_preference && (
                <Badge 
                  variant="outline" 
                  className="rounded-full text-[10px] uppercase tracking-wide bg-white/60 border-[#E5DFC6]"
                >
                  {preferences.budget_preference}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && <CollectionsLoadingSkeleton />}

        {/* Refresh button & cache indicator */}
        {!loading && itineraries.length > 0 && (
          <div className="flex justify-between items-center mb-6">
            {wasCached && (
              <p className="text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 inline mr-1" />
                Loaded instantly from your personalized cache
              </p>
            )}
            {!wasCached && <div />}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-full text-xs gap-2"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Generating fresh recommendations...' : 'Refresh with latest activity'}
            </Button>
          </div>
        )}

        {/* Itinerary grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {itineraries.map((trip) => (
              <Card
                key={trip.id}
                onClick={() => {
                  setSelectedItinerary(trip);
                  setDialogOpen(true);
                }}
                className="overflow-hidden group cursor-pointer bg-white border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={trip.heroImageUrl}
                    alt={trip.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  {/* Duration badge */}
                  <Badge className="absolute top-3 right-3 rounded-full text-[10px] uppercase tracking-wide bg-white/90 text-[#0a2225] border-none">
                    <Calendar className="h-3 w-3 mr-1" />
                    {trip.durationNights} nights
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-secondary text-lg text-[#0a2225] leading-tight group-hover:text-[#C7A962] transition-colors">
                      {trip.title}
                    </h3>
                    <p className="flex items-center gap-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {trip.primaryDestination}
                    </p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {trip.headline}
                  </p>
                  
                  {/* Vibe tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {trip.vibeTags.slice(0, 3).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="rounded-full text-[9px] uppercase tracking-wide border-[#E5DFC6] bg-[#FDF9F0]/50"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* CTAs */}
                  <div className="pt-4 flex justify-between items-center border-t border-border/30">
                    <Button 
                      asChild
                      size="sm" 
                      className="rounded-full px-4 text-xs bg-[#0a2225] hover:bg-[#0a2225]/90"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link to={`/post-trip?from=collection&destination=${encodeURIComponent(trip.primaryDestination)}&title=${encodeURIComponent(trip.title)}&nights=${trip.durationNights}&vibes=${encodeURIComponent(trip.vibeTags.join(','))}&headline=${encodeURIComponent(trip.headline)}`}>
                        Post to Marketplace
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && itineraries.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#F6F0E4] flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-[#C7A962]" />
            </div>
            <h3 className="font-secondary text-xl text-[#0a2225] mb-2">
              No collections yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Complete your travel preferences to unlock personalized collections curated just for you.
            </p>
            <Button 
              asChild
              className="rounded-full px-6 bg-[#0a2225] hover:bg-[#0a2225]/90"
            >
              <Link to="/onboarding/traveler/preferences">
                Set up preferences
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}

        {/* Luxury Fallback CTA - "Dreaming of something else?" */}
        {!loading && itineraries.length > 0 && (
          <Card className="mt-16 bg-gradient-to-br from-[#FDF9F0] to-[#F6F0E4] border border-[#E5DFC6] rounded-2xl overflow-hidden">
            <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
              {/* Left: Editorial image */}
              <div className="w-full md:w-1/3 aspect-[4/3] rounded-xl overflow-hidden flex-shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80" 
                  alt="Create your own journey"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              {/* Right: Content */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225] leading-tight">
                  Dreaming of something the AI didn't imagine?
                </h2>
                <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                  Start with a blank canvas. Build your own visual storyboard with photos, 
                  TikTok inspiration, and notes — then share it with our curated network 
                  of travel professionals, or simply keep dreaming.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center md:justify-start">
                  <Button asChild className="rounded-full px-6 bg-[#0a2225] hover:bg-[#0a2225]/90">
                    <Link to="/storyboards">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Begin Your Storyboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full px-6 border-[#E5DFC6] hover:bg-white/60">
                    <Link to="/marketplace">
                      Explore Marketplace
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Bottom CTA */}
        {!loading && itineraries.length > 0 && (
          <div className="text-center mt-16 pt-10 border-t border-[#E5DFC6]">
            <p className="text-sm text-muted-foreground mb-4">
              Want to refine your travel signature?
            </p>
            <Button 
              asChild
              variant="outline"
              className="rounded-full px-6 border-[#E5DFC6] hover:bg-[#F6F0E4]"
            >
              <Link to="/onboarding/traveler/preferences">
                Update preferences
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Itinerary Detail Dialog */}
      <ItineraryDetailDialog 
        itinerary={selectedItinerary}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
