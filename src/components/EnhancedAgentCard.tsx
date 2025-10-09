import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Star, 
  MapPin, 
  Shield, 
  CheckCircle, 
  Award, 
  Clock,
  Briefcase,
  MessageCircle,
  TrendingUp
} from "lucide-react";

interface AgentCardProps {
  id: string;
  name: string;
  agency: string;
  rating: number;
  totalReviews: number;
  specializations: string[];
  destinations: string[];
  profileImage?: string;
  experienceYears: number;
  isVerified: boolean;
  responseTime?: string;
  acceptanceRate?: number;
  completedJobs?: number;
  badges?: string[];
  onViewProfile: () => void;
  onContact: () => void;
}

export const EnhancedAgentCard = ({
  name,
  agency,
  rating,
  totalReviews,
  specializations,
  destinations,
  profileImage,
  experienceYears,
  isVerified,
  responseTime = "< 2 hours",
  acceptanceRate = 85,
  completedJobs = 0,
  badges = [],
  onViewProfile,
  onContact
}: AgentCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
      <div className="p-6">
        {/* Header with image and verification */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative flex-shrink-0">
            {profileImage ? (
              <img 
                src={profileImage} 
                alt={name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                {name.charAt(0)}
              </div>
            )}
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h3 className="font-bold text-lg truncate">{name}</h3>
                <p className="text-sm text-muted-foreground truncate">{agency}</p>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-md">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="font-bold text-sm">{rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                ({totalReviews} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Trust indicators row */}
        <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-blue-500" />
            </div>
            <p className="text-xs font-semibold">{responseTime}</p>
            <p className="text-xs text-muted-foreground">Response</p>
          </div>
          <div className="text-center border-x border-border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
            </div>
            <p className="text-xs font-semibold">{acceptanceRate}%</p>
            <p className="text-xs text-muted-foreground">Accept Rate</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Briefcase className="w-3 h-3 text-purple-500" />
            </div>
            <p className="text-xs font-semibold">{completedJobs}+</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Verification badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {isVerified && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Shield className="w-3 h-3" />
              ID Verified
            </Badge>
          )}
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500" />
            {experienceYears} years exp.
          </Badge>
          {badges.includes('top_rated') && (
            <Badge variant="outline" className="text-xs flex items-center gap-1 border-amber-500 text-amber-600">
              <Star className="w-3 h-3" />
              Top Rated
            </Badge>
          )}
          {badges.includes('quick_responder') && (
            <Badge variant="outline" className="text-xs flex items-center gap-1 border-blue-500 text-blue-600">
              <Clock className="w-3 h-3" />
              Quick Responder
            </Badge>
          )}
        </div>

        {/* Specializations */}
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Specializations:</p>
          <div className="flex flex-wrap gap-1">
            {specializations.slice(0, 3).map((spec, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {spec}
              </Badge>
            ))}
            {specializations.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{specializations.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Destinations */}
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Destinations:</p>
          </div>
          <p className="text-sm text-foreground line-clamp-2">
            {destinations.slice(0, 3).join(", ")}
            {destinations.length > 3 && ` +${destinations.length - 3} more`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={onContact}
            className="flex-1"
            size="sm"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact
          </Button>
          <Button 
            onClick={onViewProfile}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            View Profile
          </Button>
        </div>

        {/* Money-back guarantee */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Protected by escrow & money-back guarantee</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
