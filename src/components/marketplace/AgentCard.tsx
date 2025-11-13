import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Award, MapPin, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AgentCardProps {
  agent: {
    id: string;
    agency_name: string;
    user_id?: string;
    logo_url?: string;
    location?: string;
    years_in_business?: number;
    rating?: number;
    total_reviews?: number;
    specialties?: string[];
    is_verified?: boolean;
    description?: string;
  };
}

export const AgentCard = ({ agent }: AgentCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/agent/${agent.id}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="group cursor-pointer overflow-hidden border-border bg-card transition-all hover:shadow-lg hover:-translate-y-1">
      {/* Header with Logo */}
      <div className="relative h-32 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-emerald-600/10">
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            <AvatarImage src={agent.logo_url} alt={agent.agency_name} />
            <AvatarFallback className="bg-emerald-500/10 text-xl font-semibold text-emerald-600">
              {getInitials(agent.agency_name)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Verified badge */}
        {agent.is_verified && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
              <Award className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-14 p-5 space-y-4">
        {/* Agency Name */}
        <div className="text-center space-y-1">
          <h3 className="font-semibold text-lg text-foreground">
            {agent.agency_name}
          </h3>
          {agent.location && (
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{agent.location}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {agent.description && (
          <p className="text-sm text-muted-foreground text-center line-clamp-2">
            {agent.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 py-3 border-y">
          {/* Rating */}
          {agent.rating !== undefined && agent.total_reviews !== undefined && agent.total_reviews > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-foreground">{agent.rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                ({agent.total_reviews})
              </span>
            </div>
          )}

          {/* Years in Business */}
          {agent.years_in_business && (
            <div className="flex items-center gap-1 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">{agent.years_in_business}</span>
              <span className="text-muted-foreground">years</span>
            </div>
          )}
        </div>

        {/* Specialties */}
        {agent.specialties && agent.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {agent.specialties.slice(0, 4).map((specialty, idx) => (
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
          Work with Agent
        </Button>
      </div>
    </Card>
  );
};
