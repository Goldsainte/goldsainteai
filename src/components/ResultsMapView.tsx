import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { MapPin, Hotel, UtensilsCrossed, Calendar } from 'lucide-react';

interface ResultsMapViewProps {
  location: string;
  results: any[];
  type?: string;
}

const getMarkerColor = (type: string) => {
  switch (type) {
    case 'restaurants':
      return '#EF4444'; // red
    case 'events':
      return '#8B5CF6'; // purple
    default:
      return '#C4A962'; // gold for hotels
  }
};

const getPopupContent = (result: any, type: string) => {
  const name = result.name || result.title || 'Location';
  const address = result.address || result.location || '';
  
  let details = '';
  if (type === 'restaurants') {
    const rating = result.rating ? `⭐ ${result.rating}` : '';
    const cuisine = result.cuisine || '';
    const price = result.price_level || '';
    details = `
      ${rating ? `<div class="text-xs">${rating}</div>` : ''}
      ${cuisine ? `<div class="text-xs text-muted-foreground">${cuisine}</div>` : ''}
      ${price ? `<div class="text-xs">${price}</div>` : ''}
    `;
  } else if (type === 'hotels') {
    const price = result.price || result.estimated_price;
    const rating = result.property?.reviewScore || (result.rating ? Number(result.rating) * 2 : 0);
    details = `
      ${price ? `<div class="text-xs font-semibold">$${Math.round(price)}/night</div>` : ''}
      ${rating ? `<div class="text-xs">⭐ ${rating.toFixed(1)}</div>` : ''}
    `;
  } else if (type === 'events') {
    const date = result.date || '';
    const venue = result.venue || '';
    details = `
      ${date ? `<div class="text-xs">${date}</div>` : ''}
      ${venue ? `<div class="text-xs text-muted-foreground">${venue}</div>` : ''}
    `;
  }

  return `
    <div class="p-2 min-w-[200px]">
      <h3 class="font-semibold text-sm mb-1">${name}</h3>
      ${address ? `<p class="text-xs text-muted-foreground mb-1">${address}</p>` : ''}
      ${details}
    </div>
  `;
};

export const ResultsMapView = ({ location, results, type = 'hotels' }: ResultsMapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      // Check if Mapbox token is available
      const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
      if (!mapboxToken) {
        setMapError(true);
        return;
      }

      mapboxgl.accessToken = mapboxToken;
      
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-73.935242, 40.730610], // Default to NYC
        zoom: 12,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: false,
        }),
        'top-right'
      );

      const markerColor = getMarkerColor(type);
      const bounds = new mapboxgl.LngLatBounds();
      let hasValidCoordinates = false;

      // Add markers for each result with coordinates
      results.forEach((result) => {
        const lat = Number(result.latitude);
        const lng = Number(result.longitude);
        
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          hasValidCoordinates = true;
          bounds.extend([lng, lat]);
          
          const marker = new mapboxgl.Marker({ color: markerColor })
            .setLngLat([lng, lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25, maxWidth: '300px' })
                .setHTML(getPopupContent(result, type))
            )
            .addTo(map.current!);
        }
      });

      // Fit map or geocode location to center
      if (hasValidCoordinates) {
        map.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 15,
        });
      } else if (location) {
        // Fallback: center map based on the searched city using Mapbox Geocoding
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxToken}&limit=1`)
          .then((res) => res.ok ? res.json() : null)
          .then((geo) => {
            const feature = geo?.features?.[0];
            if (feature?.center && map.current) {
              map.current.setCenter(feature.center as [number, number]);
              map.current.setZoom(12);
            }
          })
          .catch((e) => console.warn('Geocoding failed:', e));
      }

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

  const getTypeLabel = () => {
    switch (type) {
      case 'restaurants':
        return 'Restaurant';
      case 'events':
        return 'Event';
      default:
        return 'Hotel';
    }
  };

  const TypeIcon = type === 'restaurants' ? UtensilsCrossed : type === 'events' ? Calendar : Hotel;

  return (
    <Card className="overflow-hidden mb-4">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
        <TypeIcon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {getTypeLabel()} Locations Map - {results.length} Results
        </span>
      </div>
      <div 
        ref={mapContainer} 
        className="w-full h-[350px]"
        style={{ minHeight: '350px' }}
      />
    </Card>
  );
};
