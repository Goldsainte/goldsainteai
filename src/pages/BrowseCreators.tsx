import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Globe, Users, TrendingUp, MapPin } from "lucide-react";

interface MockCreator {
  id: string;
  name: string;
  tiktokHandle: string;
  avatarUrl: string;
  niche: string[];
  regions: string[];
  followers: number;
  avgViews: number;
  engagementRate: number;
  bio: string;
}

const MOCK_CREATORS: MockCreator[] = [
  {
    id: "1",
    name: "Sarah Chen",
    tiktokHandle: "@sarahgoesglobal",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    niche: ["Luxury Travel", "Fine Dining", "Hotels"],
    regions: ["Europe", "Asia"],
    followers: 450000,
    avgViews: 125000,
    engagementRate: 8.5,
    bio: "Luxury travel curator sharing 5-star experiences and hidden gems across Europe and Asia",
  },
  {
    id: "2",
    name: "Marcus Adventure",
    tiktokHandle: "@marcusadventure",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    niche: ["Adventure", "Hiking", "Wildlife"],
    regions: ["South America", "Africa"],
    followers: 680000,
    avgViews: 210000,
    engagementRate: 12.3,
    bio: "Adventure seeker documenting extreme travel experiences and wildlife encounters",
  },
  {
    id: "3",
    name: "Elena Beaches",
    tiktokHandle: "@elenabeaches",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
    niche: ["Beach Resorts", "Island Hopping", "Wellness"],
    regions: ["Caribbean", "Pacific Islands"],
    followers: 320000,
    avgViews: 95000,
    engagementRate: 9.8,
    bio: "Island life specialist sharing the world's most stunning beaches and wellness retreats",
  },
  {
    id: "4",
    name: "James Foodie",
    tiktokHandle: "@jamesfoodietravel",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    niche: ["Food Tourism", "Street Food", "Michelin Dining"],
    regions: ["Asia", "Europe"],
    followers: 890000,
    avgViews: 340000,
    engagementRate: 15.2,
    bio: "Culinary explorer showcasing street food gems and Michelin-starred experiences",
  },
];

export default function BrowseCreators() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const filteredCreators = MOCK_CREATORS.filter((creator) => {
    const matchesSearch =
      searchQuery === "" ||
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.tiktokHandle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.bio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesNiche =
      !selectedNiche || creator.niche.some((n) => n === selectedNiche);

    const matchesRegion =
      !selectedRegion || creator.regions.some((r) => r === selectedRegion);

    return matchesSearch && matchesNiche && matchesRegion;
  });

  const allNiches = Array.from(
    new Set(MOCK_CREATORS.flatMap((c) => c.niche))
  ).sort();
  const allRegions = Array.from(
    new Set(MOCK_CREATORS.flatMap((c) => c.regions))
  ).sort();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Creator Marketplace</h1>
          <p className="text-muted-foreground">
            Discover TikTok travel creators to collaborate on curated trip experiences
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search creators by name, handle, or expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Niche Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground self-center">
              Niche:
            </span>
            <Button
              variant={selectedNiche === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedNiche(null)}
            >
              All
            </Button>
            {allNiches.map((niche) => (
              <Button
                key={niche}
                variant={selectedNiche === niche ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedNiche(niche)}
              >
                {niche}
              </Button>
            ))}
          </div>

          {/* Region Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground self-center">
              Region:
            </span>
            <Button
              variant={selectedRegion === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRegion(null)}
            >
              All
            </Button>
            {allRegions.map((region) => (
              <Button
                key={region}
                variant={selectedRegion === region ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRegion(region)}
              >
                {region}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredCreators.length} creator{filteredCreators.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Creator Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator) => (
            <Card key={creator.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={creator.avatarUrl} alt={creator.name} />
                    <AvatarFallback>{creator.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-1">{creator.name}</CardTitle>
                    <p className="text-sm text-muted-foreground truncate">
                      {creator.tiktokHandle}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Bio */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {creator.bio}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                      <Users className="h-3 w-3" />
                      {formatNumber(creator.followers)}
                    </div>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                      <Globe className="h-3 w-3" />
                      {formatNumber(creator.avgViews)}
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Views</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                      <TrendingUp className="h-3 w-3" />
                      {creator.engagementRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                </div>

                {/* Niches */}
                <div>
                  <p className="text-xs font-medium mb-2">Niches</p>
                  <div className="flex flex-wrap gap-1">
                    {creator.niche.map((n) => (
                      <Badge key={n} variant="secondary" className="text-xs">
                        {n}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Regions */}
                <div>
                  <p className="text-xs font-medium mb-2">Regions</p>
                  <div className="flex flex-wrap gap-1">
                    {creator.regions.map((r) => (
                      <Badge key={r} variant="outline" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/creator/${creator.id}`)}
                  >
                    View Creator
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      navigate(`/collabs/new?creatorId=${creator.id}`)
                    }
                  >
                    Propose Collab
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredCreators.length === 0 && (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No creators found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedNiche(null);
                setSelectedRegion(null);
              }}
            >
              Clear Filters
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
