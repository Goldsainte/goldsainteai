import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const FeedSkeleton = () => {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          
          {/* Media */}
          <Skeleton className="w-full aspect-square" />
          
          {/* Actions */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-6" />
            </div>
            <Skeleton className="h-4 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
