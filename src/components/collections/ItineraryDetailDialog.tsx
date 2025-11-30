import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, Calendar, Sparkles, Utensils, Home, Sun, Send, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { encodeData } from "@/lib/utils";

interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  activities: string[];
  meals: string;
  accommodation: string;
}

interface CuratedItinerary {
  id: string;
  title: string;
  heroImageUrl: string;
  primaryDestination: string;
  vibeTags: string[];
  durationNights: number;
  headline: string;
  budgetRange?: string;
  itinerary?: ItineraryDay[];
}

interface ItineraryDetailDialogProps {
  itinerary: CuratedItinerary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItineraryDetailDialog({ itinerary, open, onOpenChange }: ItineraryDetailDialogProps) {
  if (!itinerary) return null;

  const hasItinerary = itinerary.itinerary && itinerary.itinerary.length > 0;

  // Build URL params for Post to Marketplace
  const buildPostTripUrl = () => {
    const params = new URLSearchParams({
      from: "collection",
      destination: itinerary.primaryDestination,
      title: itinerary.title,
      nights: String(itinerary.durationNights),
      vibes: itinerary.vibeTags.join(","),
      headline: itinerary.headline,
    });
    
    if (itinerary.budgetRange) {
      params.set("budget", itinerary.budgetRange);
    }
    
    if (hasItinerary) {
      params.set("itinerary", encodeData(itinerary.itinerary));
    }
    
    return `/post-trip?${params.toString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden bg-[#FDF9F0] border-none rounded-2xl">
        {/* Hero Image */}
        <div className="relative h-48 sm:h-64">
          <img
            src={itinerary.heroImageUrl}
            alt={itinerary.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Duration badge */}
          <Badge className="absolute top-4 right-4 rounded-full text-xs bg-white/90 text-[#0a2225] border-none">
            <Calendar className="h-3 w-3 mr-1" />
            {itinerary.durationNights} nights
          </Badge>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="font-secondary text-2xl sm:text-3xl text-white mb-2">
              {itinerary.title}
            </h2>
            <p className="flex items-center gap-1 text-sm text-white/80">
              <MapPin className="h-4 w-4" />
              {itinerary.primaryDestination}
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-16rem)]">
          <div className="p-6 space-y-6">
            {/* Headline */}
            <p className="text-base text-[#4a4a4a] leading-relaxed">
              {itinerary.headline}
            </p>

            {/* Vibe tags */}
            <div className="flex flex-wrap gap-2">
              {itinerary.vibeTags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="rounded-full text-xs uppercase tracking-wide border-[#E5DFC6] bg-white"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Day-by-Day Itinerary */}
            {hasItinerary ? (
              <div className="space-y-3">
                <h3 className="font-secondary text-lg text-[#0a2225] flex items-center gap-2">
                  <Sun className="h-5 w-5 text-[#C7A962]" />
                  Day-by-Day Itinerary
                </h3>
                <Accordion type="single" collapsible className="space-y-2">
                  {itinerary.itinerary!.map((day) => (
                    <AccordionItem 
                      key={day.dayNumber} 
                      value={`day-${day.dayNumber}`}
                      className="border border-[#E5DFC6] rounded-xl bg-white overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-[#F6F0E4]/50">
                        <div className="flex items-center gap-3 text-left">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0a2225] text-white text-sm font-medium">
                            {day.dayNumber}
                          </span>
                          <div>
                            <p className="font-medium text-[#0a2225]">{day.title}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4 pt-2">
                          <p className="text-sm text-[#4a4a4a]">{day.description}</p>
                          
                          {/* Activities */}
                          <div>
                            <p className="text-xs font-medium text-[#6E6650] uppercase tracking-wide mb-2">Activities</p>
                            <ul className="space-y-1">
                              {day.activities.map((activity, idx) => (
                                <li key={idx} className="text-sm text-[#4a4a4a] flex items-start gap-2">
                                  <span className="text-[#C7A962] mt-1">•</span>
                                  {activity}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Meals & Accommodation */}
                          <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-[#E5DFC6]">
                            <div className="flex-1">
                              <div className="flex items-center gap-1 text-xs font-medium text-[#6E6650] uppercase tracking-wide mb-1">
                                <Utensils className="h-3 w-3" />
                                Meals
                              </div>
                              <p className="text-sm text-[#4a4a4a]">{day.meals}</p>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-1 text-xs font-medium text-[#6E6650] uppercase tracking-wide mb-1">
                                <Home className="h-3 w-3" />
                                Stay
                              </div>
                              <p className="text-sm text-[#4a4a4a]">{day.accommodation}</p>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F6F0E4] border border-[#E5DFC6]">
                <Sparkles className="h-5 w-5 text-[#C7A962] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-[#6E6650]">
                  <p className="font-medium text-[#0a2225] mb-1">AI-Curated Inspiration</p>
                  <p>This itinerary was generated based on your travel preferences. Post to the marketplace to let agents bid on making it real.</p>
                </div>
              </div>
            )}

            {/* CTAs - Post to Marketplace is primary */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                asChild
                className="flex-1 rounded-full bg-[#0a2225] hover:bg-[#0a2225]/90"
              >
                <Link to={buildPostTripUrl()}>
                  <Send className="h-4 w-4 mr-2" />
                  Post to Marketplace
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                className="flex-1 rounded-full border-[#E5DFC6] hover:bg-[#F6F0E4]"
              >
                <Link to={`/concierge?destination=${encodeURIComponent(itinerary.primaryDestination)}&context=${encodeURIComponent(itinerary.title)}&nights=${itinerary.durationNights}&vibes=${encodeURIComponent(itinerary.vibeTags.join(','))}`}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Ask Madison
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
