import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Briefcase, CheckCircle2, Shield, Award, Clock, TrendingUp } from "lucide-react";
import { TrustScoreVisualization } from "./TrustScoreVisualization";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnhancedAgentCardProps {
  agent: any;
  metrics?: any;
  badges?: any[];
  onClick: () => void;
}

export const EnhancedAgentCard = ({ agent, metrics, badges, onClick }: EnhancedAgentCardProps) => {
  // Calculate years on platform
  const yearsOnPlatform = agent.created_at 
    ? Math.max(0, Math.floor((new Date().getTime() - new Date(agent.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)))
    : 0;

  // Calculate trust score (0-100)
  const calculateTrustScore = () => {
    let score = 0;
    if (agent.identity_verified) score += 25;
    if (agent.background_check_status === 'approved') score += 25;
    if (agent.professional_license_verified) score += 20;
    if (agent.insurance_verified) score += 15;
    if (agent.rating >= 4.5) score += 15;
    return Math.min(100, score);
  };

  const trustScore = calculateTrustScore();

  // Professional certifications (mock data - would come from DB)
  const hasCertifications = agent.professional_license_verified;

  return (
    <Card className="hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden" onClick={onClick}>
      {/* Trust indicator ribbon */}
      {agent.identity_verified && (
        <div className="absolute top-4 -right-12 rotate-45 bg-green-600 text-white text-xs font-bold py-1 px-12 shadow-md">
          VERIFIED
        </div>
      )}

      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={agent.profile_image_url} />
              <AvatarFallback className="text-2xl bg-primary/10">
                {agent.agency_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            {agent.identity_verified && (
              <div className="absolute -bottom-1 -right-1 bg-green-600 rounded-full p-1">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-secondary truncate group-hover:text-primary transition-colors">
              {agent.agency_name}
            </CardTitle>
            
            {/* Rating and reviews */}
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-[#C7A962] text-[#C7A962]" />
                <span className="text-sm font-semibold">{agent.rating?.toFixed(1) || '0.0'}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                ({agent.total_reviews || 0} reviews)
              </span>
            </div>

            {/* Verification badges */}
            <div className="flex flex-wrap gap-1 mt-2">
              {agent.identity_verified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Shield className="h-3 w-3" />
                        ID Verified
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Government-issued ID verified</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {yearsOnPlatform >= 1 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs gap-1">
                        <Clock className="h-3 w-3" />
                        {yearsOnPlatform}+ {yearsOnPlatform === 1 ? 'year' : 'years'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Years on Goldsainte platform</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {hasCertifications && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="text-xs gap-1 bg-[#F0F7F6] text-[#0c4d47] border-[#0c4d47]/20">
                        <Award className="h-3 w-3" />
                        Certified
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Professional certifications verified</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trust Score Visualization */}
        <TrustScoreVisualization score={trustScore} showLabel={false} />

        <Separator />

        {/* Bio */}
        <CardDescription className="line-clamp-2">
          {agent.bio || 'Experienced travel professional dedicated to creating unforgettable journeys.'}
        </CardDescription>

        {/* Performance metrics */}
        {metrics && (
          <div className="grid grid-cols-2 gap-3 py-2">
            {metrics.jobs_completed > 0 && (
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-lg font-bold text-primary">{metrics.jobs_completed}</span>
                </div>
                <p className="text-xs text-muted-foreground">Bookings</p>
              </div>
            )}
            
            {metrics.avg_response_time_minutes && (
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-bold text-green-600">
                    {Math.round(metrics.avg_response_time_minutes)}m
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Response</p>
              </div>
            )}
          </div>
        )}

        {/* Specializations */}
        {agent.specializations && agent.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {agent.specializations.slice(0, 3).map((spec: string) => (
              <Badge key={spec} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
            {agent.specializations.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{agent.specializations.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Additional info */}
        <div className="space-y-2 text-sm">
          {agent.destinations && agent.destinations.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {agent.destinations.slice(0, 2).join(', ')}
                {agent.destinations.length > 2 && ` +${agent.destinations.length - 2}`}
              </span>
            </div>
          )}
          
          {agent.experience_years && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4 flex-shrink-0" />
              <span>{agent.experience_years} years industry experience</span>
            </div>
          )}
        </div>

        {/* Special badges from database */}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t">
            {badges.slice(0, 3).map((badge) => (
              <Badge key={badge.id} variant="outline" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {badge.badge_type === 'quick_responder' && 'Quick Responder'}
                {badge.badge_type === 'top_rated' && 'Top Rated'}
                {badge.badge_type === 'reliable' && 'Reliable'}
                {badge.badge_type === 'high_acceptance' && 'High Acceptance'}
              </Badge>
            ))}
          </div>
        )}

        <Button className="w-full" size="sm">
          View Full Profile
        </Button>
      </CardContent>
    </Card>
  );
};
