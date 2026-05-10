import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Navigation, Coffee, Utensils, ShoppingBag, Landmark, Award } from "lucide-react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Attraction {
  name: string;
  category: string;
  distance: string;
  rating?: number;
  icon: any;
}

interface ExploreAreaProps {
  cityName: string;
  latitude?: number;
  longitude?: number;
}

export const ExploreArea = ({ cityName, latitude = 40.7128, longitude = -74.0060 }: ExploreAreaProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'; // Public demo token
    
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: 13,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add marker for hotel location
    new mapboxgl.Marker({ color: '#D4AF37' })
      .setLngLat([longitude, latitude])
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${cityName}</strong>`))
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [cityName, latitude, longitude]);
  const attractions: Attraction[] = [
    { name: "City Center", category: "Downtown", distance: "0.5 km", rating: 4.8, icon: Landmark },
    { name: "Grand Museum", category: "Museum", distance: "1.2 km", rating: 4.9, icon: Award },
    { name: "Central Park", category: "Park", distance: "0.8 km", rating: 4.7, icon: MapPin },
    { name: "Local Market", category: "Shopping", distance: "0.6 km", rating: 4.6, icon: ShoppingBag },
    { name: "Fine Dining District", category: "Restaurant", distance: "0.3 km", rating: 4.8, icon: Utensils },
    { name: "Artisan Coffee House", category: "Café", distance: "0.2 km", rating: 4.5, icon: Coffee },
  ];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Downtown": "bg-[#F0F7F6] text-[#0c4d47]",
      "Museum": "bg-purple-100 text-purple-700",
      "Park": "bg-green-100 text-green-700",
      "Shopping": "bg-pink-100 text-pink-700",
      "Restaurant": "bg-orange-100 text-orange-700",
      "Café": "bg-amber-100 text-amber-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Explore the area</h3>
        <Navigation className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Interactive Map */}
      <div ref={mapContainer} className="aspect-video rounded-lg overflow-hidden border" />

      {/* Attractions List */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          What's nearby
        </h4>
        
        {attractions.map((attraction, idx) => (
          <div 
            key={idx} 
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
              <attraction.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium group-hover:text-primary transition-colors">
                {attraction.name}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={getCategoryColor(attraction.category)}>
                  {attraction.category}
                </Badge>
                {attraction.rating && (
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="font-medium">{attraction.rating}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {attraction.distance}
            </div>
          </div>
        ))}
      </div>

      {/* Transportation Info */}
      <div className="pt-4 border-t space-y-2">
        <h4 className="font-semibold text-sm">Getting around</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-[#0c4d47]" />
            <span>Metro: 5 min walk</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Bus: 2 min walk</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Airport: 25 km</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Train: 10 min walk</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
