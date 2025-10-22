import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const globalCulinaryCities = [
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34" },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf" },
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060, image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9" },
  { name: "Barcelona", country: "Spain", lat: 41.3851, lng: 2.1734, image: "https://images.unsplash.com/photo-1583422409516-2895a77efded" },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278, image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad" },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5" },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd" },
  { name: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683, image: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc" },
  { name: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194, image: "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb" },
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365" },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9" },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c" },
];

const cuisineTypes = [
  { name: "French Fine Dining", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1" },
  { name: "Japanese Kaiseki", image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351" },
  { name: "Italian Trattoria", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9" },
  { name: "Modern European", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836" },
  { name: "Asian Fusion", image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43" },
  { name: "Mediterranean", image: "https://images.unsplash.com/photo-1544025162-d76694265947" },
];

export default function FineDining() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Custom Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <button 
            onClick={() => navigate('/')}
            className="text-luxury-emerald hover:text-luxury-emerald/80 font-secondary text-2xl"
          >
            Goldsainte
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-24 text-center px-4">
        <div className="w-20 h-1 bg-luxury-gold mx-auto mb-6" />
        <h1 className="font-secondary text-4xl md:text-5xl lg:text-6xl font-light mb-4">
          The World's Finest Restaurants
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          From Michelin-starred institutions to hidden culinary gems
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by city, cuisine, or restaurant name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg"
          />
        </div>
      </section>

      {/* Popular Culinary Destinations */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="w-20 h-1 bg-luxury-gold mx-auto mb-4" />
            <h2 className="font-secondary text-3xl md:text-4xl font-light mb-2">
              Culinary Destinations
            </h2>
            <p className="text-muted-foreground">Explore fine dining in the world's greatest cities</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {globalCulinaryCities.map((city) => (
              <Card
                key={city.name}
                className="group cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                onClick={() => console.log(`Selected ${city.name}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-secondary text-xl font-light">{city.name}</h3>
                    <p className="text-sm text-white/80">{city.country}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cuisine Types */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="w-20 h-1 bg-luxury-gold mx-auto mb-4" />
            <h2 className="font-secondary text-3xl md:text-4xl font-light mb-2">
              By Cuisine
            </h2>
            <p className="text-muted-foreground">Discover your culinary preference</p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {cuisineTypes.map((cuisine) => (
              <Card
                key={cuisine.name}
                className="group flex-shrink-0 w-64 cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={cuisine.image}
                    alt={cuisine.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-secondary text-lg font-light">{cuisine.name}</h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Restaurants - Coming Soon */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <div className="w-20 h-1 bg-luxury-gold mx-auto mb-4" />
          <h2 className="font-secondary text-3xl md:text-4xl font-light mb-2">
            Featured Restaurants
          </h2>
          <p className="text-muted-foreground mb-8">
            Select a city or cuisine to discover exceptional dining experiences
          </p>
          <Button 
            size="lg"
            className="bg-luxury-gold text-luxury-emerald hover:bg-luxury-gold/90"
          >
            Search Restaurants
          </Button>
        </div>
      </section>
    </div>
  );
}
