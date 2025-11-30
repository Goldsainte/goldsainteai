import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

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

interface ItineraryDetailDialogProps {
  itinerary: CuratedItinerary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItineraryDetailDialog({ itinerary, open, onOpenChange }: ItineraryDetailDialogProps) {
  if (!itinerary) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-[#FDF9F0] border-none rounded-2xl">
        {/* Hero Image */}
        <div className="relative h-64 sm:h-80">
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

        {/* Content */}
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

          {/* AI-generated notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F6F0E4] border border-[#E5DFC6]">
            <Sparkles className="h-5 w-5 text-[#C7A962] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#6E6650]">
              <p className="font-medium text-[#0a2225] mb-1">AI-Curated Inspiration</p>
              <p>This itinerary was generated based on your travel preferences. Create a storyboard to save and customize it, or ask Madison for personalized recommendations.</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              asChild
              className="flex-1 rounded-full bg-[#0a2225] hover:bg-[#0a2225]/90"
            >
              <Link to={`/storyboards/new?destination=${encodeURIComponent(itinerary.primaryDestination)}&title=${encodeURIComponent(itinerary.title)}`}>
                Create storyboard
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline"
              className="flex-1 rounded-full border-[#E5DFC6] hover:bg-[#F6F0E4]"
            >
              <Link to={`/concierge?destination=${encodeURIComponent(itinerary.primaryDestination)}&context=${encodeURIComponent(itinerary.title)}`}>
                Ask Madison
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
