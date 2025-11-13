import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Eye, Heart, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CreatorCardProps {
  creator: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    identity_verified?: boolean;
    stats: {
      trips_created: number;
      avg_views: number;
      avg_engagement?: number;
    };
    specialties?: string[];
    rating?: number;
    review_count?: number;
  };
}

export const CreatorCard = ({ creator }: CreatorCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/marketplace/creator/${creator.id}`);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="group cursor-pointer overflow-hidden border-border bg-card transition-all hover:shadow-lg hover:-translate-y-1">
      {/* Header with Avatar */}
      <div className="relative h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10">
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
            <AvatarFallback className="bg-primary/10 text-xl font-semibold">
              {getInitials(creator.full_name || creator.username)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Verified badge */}
        {creator.identity_verified && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
              ✓ Verified
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-14 p-5 space-y-4">
        {/* Name & Handle */}
        <div className="text-center space-y-1">
          <h3 className="font-semibold text-lg text-foreground">
            {creator.full_name || creator.username}
          </h3>
          {creator.username && (
            <p className="text-sm text-muted-foreground">@{creator.username}</p>
          )}
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="text-sm text-muted-foreground text-center line-clamp-2">
            {creator.bio}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {creator.stats.trips_created}
            </div>
            <div className="text-xs text-muted-foreground">Trips Created</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(creator.stats.avg_views)}
            </div>
            <div className="text-xs text-muted-foreground">Avg Views</div>
          </div>
        </div>

        {/* Rating */}
        {creator.rating !== undefined && creator.review_count !== undefined && creator.review_count > 0 && (
          <div className="flex items-center justify-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{creator.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({creator.review_count} {creator.review_count === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}

        {/* Specialties */}
        {creator.specialties && creator.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {creator.specialties.slice(0, 4).map((specialty, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <Button
          className="w-full"
          variant="default"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          View Profile
        </Button>
      </div>
    </Card>
  );
};
