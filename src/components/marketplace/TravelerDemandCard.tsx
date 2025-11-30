import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Wallet, Users, Plane } from "lucide-react";

interface TravelerProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  home_base: string | null;
}

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
  profiles: TravelerProfile | null;
}

interface TravelerDemandCardProps {
  traveler: TravelerPreference;
  onCurateTrip: () => void;
}

export default function TravelerDemandCard({ traveler, onCurateTrip }: TravelerDemandCardProps) {
  const profile = traveler.profiles;
  const initials = profile?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "T";

  const displayName = profile?.display_name || "Anonymous Traveler";
  const destinations = traveler.preferred_destinations || [];
  const styles = traveler.travel_style || [];

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 bg-card">
      <CardContent className="p-5 space-y-4">
        {/* Profile Header */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
            <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{displayName}</p>
            {profile?.home_base && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Based in {profile.home_base}
              </p>
            )}
          </div>
        </div>

        {/* Dream Destinations */}
        {destinations.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Plane className="w-3 h-3" />
              Dreams of traveling to
            </p>
            <div className="flex flex-wrap gap-1.5">
              {destinations.slice(0, 5).map((dest) => (
                <Badge
                  key={dest}
                  variant="outline"
                  className="rounded-full text-[10px] px-2 py-0.5"
                >
                  {dest.split(",")[0]}
                </Badge>
              ))}
              {destinations.length > 5 && (
                <Badge
                  variant="secondary"
                  className="rounded-full text-[10px] px-2 py-0.5"
                >
                  +{destinations.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Travel Style & Budget */}
        <div className="flex items-center justify-between text-xs text-muted-foreground gap-2">
          {styles.length > 0 && (
            <span className="flex items-center gap-1 truncate">
              <Users className="w-3 h-3 flex-shrink-0" />
              {styles.slice(0, 2).join(" • ")}
            </span>
          )}
          {traveler.budget_preference && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <Wallet className="w-3 h-3" />
              {traveler.budget_preference}
            </span>
          )}
        </div>

        {/* Additional Info */}
        <div className="flex flex-wrap gap-2 text-[10px]">
          {traveler.travel_companions && (
            <Badge variant="secondary" className="rounded-full px-2 py-0.5">
              Travels: {traveler.travel_companions}
            </Badge>
          )}
          {traveler.trip_frequency && (
            <Badge variant="secondary" className="rounded-full px-2 py-0.5">
              {traveler.trip_frequency}
            </Badge>
          )}
        </div>

        {/* CTA */}
        <Button
          className="w-full rounded-full"
          onClick={onCurateTrip}
        >
          Curate a trip for this traveler
        </Button>
      </CardContent>
    </Card>
  );
}
