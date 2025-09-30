import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface HotelMapProps {
  latitude?: number;
  longitude?: number;
  hotelName: string;
  landmarks?: Array<{
    name: string;
    lat: number;
    lng: number;
    distance: string;
  }>;
}

export const HotelMap = ({ latitude, longitude, hotelName, landmarks = [] }: HotelMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !latitude || !longitude) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: 14,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add hotel marker
    const hotelMarker = new mapboxgl.Marker({ color: '#D4AF37' })
      .setLngLat([longitude, latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<div class="font-semibold">${hotelName}</div>`)
      )
      .addTo(map.current);

    // Add landmark markers
    landmarks.forEach((landmark) => {
      new mapboxgl.Marker({ color: '#6B7280', scale: 0.8 })
        .setLngLat([landmark.lng, landmark.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<div><strong>${landmark.name}</strong><br/><span class="text-sm">${landmark.distance} away</span></div>`)
        )
        .addTo(map.current!);
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [latitude, longitude, hotelName, landmarks]);

  if (!latitude || !longitude) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Map location not available</p>
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full h-64 rounded-lg" />;
};
