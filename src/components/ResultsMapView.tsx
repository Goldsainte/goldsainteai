import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface ResultsMapViewProps {
  location: string;
  results: any[];
  type?: string;
}

export const ResultsMapView = ({ location, results, type = 'hotels' }: ResultsMapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      // Check if Mapbox token is available
      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
      if (!mapboxToken) {
        setMapError(true);
        return;
      }

      mapboxgl.accessToken = mapboxToken;
      
      // Initialize map centered on the location
      // In production, you'd geocode the location string to get coordinates
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [2.3522, 48.8566], // Default to Paris, should be geocoded from location
        zoom: 12,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: false,
        }),
        'top-right'
      );

      // Add markers for each result with coordinates
      results.forEach((result, index) => {
        if (result.latitude && result.longitude) {
          const marker = new mapboxgl.Marker({ color: '#C4A962' })
            .setLngLat([result.longitude, result.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<div class="p-2">
                  <h3 class="font-semibold text-sm">${result.name || result.title || 'Property'}</h3>
                  <p class="text-xs text-muted-foreground">${result.price ? `$${result.price}/night` : ''}</p>
                </div>`
              )
            )
            .addTo(map.current!);
        }
      });

      // Cleanup
      return () => {
        map.current?.remove();
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(true);
    }
  }, [location, results]);

  if (mapError) {
    return (
      <Card className="h-[250px] flex items-center justify-center bg-muted">
        <div className="text-center p-6">
          <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Map view unavailable
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Configure Mapbox token to enable maps
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden mb-4">
      <div 
        ref={mapContainer} 
        className="w-full h-[250px]"
        style={{ minHeight: '250px' }}
      />
    </Card>
  );
};
