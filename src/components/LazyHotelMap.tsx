import { lazy, Suspense } from "react";
import { LoadingFallback } from "./LoadingFallback";

const HotelMap = lazy(() => import("./HotelMap").then(m => ({ default: m.HotelMap })));

interface LazyHotelMapProps {
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

export const LazyHotelMap = (props: LazyHotelMapProps) => {
  return (
    <Suspense fallback={<LoadingFallback message="Loading map..." />}>
      <HotelMap {...props} />
    </Suspense>
  );
};
