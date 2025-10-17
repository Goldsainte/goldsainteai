import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PackageSearchHeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
}

export const PackageSearchHero = ({
  searchQuery,
  onSearchChange,
  onSearch,
}: PackageSearchHeroProps) => {
  return (
    <div className="relative h-[500px] flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary-foreground/90 z-0" />
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 opacity-30"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80')"
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          Discover Curated Travel Experiences
        </h1>
        <p className="text-xl text-white/90 mb-8">
          Expert-crafted packages by verified travel agents
        </p>
        
        {/* Search Bar */}
        <div className="flex gap-2 bg-white rounded-lg p-2 shadow-lg max-w-2xl mx-auto">
          <div className="flex-1 flex items-center gap-2 px-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Where do you want to go?"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="border-0 focus-visible:ring-0 text-lg"
            />
          </div>
          <Button onClick={onSearch} size="lg" className="px-8">
            <Search className="h-5 w-5 mr-2" />
            Search
          </Button>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          {["Adventure", "Luxury", "Family-Friendly", "Budget", "Romantic"].map((tag) => (
            <button
              key={tag}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-medium transition-colors backdrop-blur-sm"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
