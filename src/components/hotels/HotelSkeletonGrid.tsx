import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface HotelSkeletonGridProps {
  count?: number;
}

export const HotelSkeletonGrid = ({ count = 8 }: HotelSkeletonGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="flex gap-3 p-3">
            {/* Image skeleton with locked 4:3 aspect ratio */}
            <Skeleton className="w-32 aspect-[4/3] flex-shrink-0 rounded-md" />
            
            {/* Content skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            
            {/* Price & Action skeleton */}
            <div className="flex flex-col items-end justify-between min-w-[120px]">
              <div className="space-y-1 text-right">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-7 w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
