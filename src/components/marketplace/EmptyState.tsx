import { Button } from "@/components/ui/button";
import { Compass, Users, Briefcase, MapPin } from "lucide-react";

interface EmptyStateProps {
  type: "trips" | "creators" | "agents" | "brands" | "trip-requests";
  onAction: () => void;
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const config = {
    trips: {
      icon: MapPin,
      title: "No trips found",
      description: "Be the first to post your dream journey and let creators build it.",
      actionLabel: "Post your dream trip",
    },
    creators: {
      icon: Users,
      title: "No creators found",
      description: "Check back soon for inspiring travel creators and content partners.",
      actionLabel: "Browse all creators",
    },
    agents: {
      icon: Briefcase,
      title: "No agents found",
      description: "Certified travel agents will appear here once verified.",
      actionLabel: "Browse all agents",
    },
    brands: {
      icon: Briefcase,
      title: "No brands found",
      description: "Verified hotels, residences and brands will appear here once they're live on Goldsainte.",
      actionLabel: "Browse all brands",
    },
    "trip-requests": {
      icon: Compass,
      title: "No trip requests found",
      description: "Post your dream trip and let experts bid to bring it to life.",
      actionLabel: "Post your dream trip",
    },
  };

  const { icon: Icon, title, description, actionLabel } = config[type];

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[#E5DFC6]/30 bg-white p-12 text-center">
      <div className="mb-4 rounded-full bg-[#FBF9F0] p-4">
        <Icon className="h-8 w-8 text-[#BFAD72]" />
      </div>
      <h3 className="mb-2 font-display text-2xl text-[#0a2225]">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-[#4a4a4a]">{description}</p>
      <Button
        onClick={onAction}
        className="rounded-full bg-[#0c4d47] px-6 py-2.5 font-semibold text-[#E5DFC6] hover:bg-[#073331]"
      >
        {actionLabel}
      </Button>
    </div>
  );
}
