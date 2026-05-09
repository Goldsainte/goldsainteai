import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, ThumbsUp, User } from "lucide-react";

interface Review {
  id?: string;
  author: string;
  avatar?: string;
  rating: number;
  title?: string;
  content: string;
  text?: string; // alias for content
  date: string;
  helpful?: number;
  verified?: boolean;
  photos?: string[];
  profileImage?: string; // from Google Places
  tripType?: string;
}

interface ReviewsSectionProps {
  hotelId: string;
  hotelName: string;
  averageRating: number;
  totalReviews: number;
  realReviews?: Review[]; // Real reviews from Google Places API
}

export const ReviewsSection = ({ hotelId, hotelName, averageRating, totalReviews, realReviews }: ReviewsSectionProps) => {
  const [sortBy, setSortBy] = useState("most_recent");
  const [showAll, setShowAll] = useState(false);

  // STRICT RULE: Only use real reviews from API, never generate fallback content
  const reviews = useMemo((): Review[] => {
    if (realReviews && realReviews.length > 0) {
      // Use real reviews from API
      return realReviews.map((review, i) => ({
        id: review.id || `review-${i}`,
        author: review.author,
        avatar: review.profileImage || review.avatar,
        rating: review.rating,
        title: review.title || "",
        content: review.content || review.text || "",
        date: review.date,
        helpful: review.helpful || 0,
        verified: review.verified !== undefined ? review.verified : true,
        photos: review.photos,
        tripType: review.tripType || "Traveler",
      }));
    }

    // Return empty array if no real reviews - NEVER generate fake reviews
    return [];
  }, [realReviews]);

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    
    switch (sortBy) {
      case "highest_rated":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest_rated":
        sorted.sort((a, b) => a.rating - b.rating);
        break;
      case "most_helpful":
        sorted.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
        break;
      default: // most_recent
        // Already sorted by date in generation
        break;
    }
    
    return sorted;
  }, [reviews, sortBy]);

  const displayedReviews = showAll ? sortedReviews : sortedReviews.slice(0, 20);

  // Calculate rating distribution
  const ratingDistribution = useMemo(() => {
    const dist = { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0 };
    if (reviews.length === 0) return dist; // Return empty distribution if no reviews
    reviews.forEach(review => {
      const roundedRating = Math.floor(review.rating);
      if (roundedRating >= 6) {
        dist[roundedRating as keyof typeof dist]++;
      }
    });
    return dist;
  }, [reviews]);

  const getRatingText = (score: number) => {
    if (score >= 9) return "Wonderful";
    if (score >= 8.5) return "Excellent";
    if (score >= 8) return "Very Good";
    if (score >= 7) return "Good";
    return "Pleasant";
  };

  return (
    <div className="space-y-6">
      {reviews.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-3">
            <Star className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="text-xl font-semibold">No reviews available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              This property doesn't have verified reviews yet. Check back later or contact us for more information about this property.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Rating Overview */}
          <Card className="p-6">
            <div className="grid md:grid-cols-[300px_1fr] gap-8">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-primary text-primary-foreground rounded-lg mb-4">
                  <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
                </div>
                <div className="text-xl font-semibold mb-1">{getRatingText(averageRating)}</div>
                <div className="text-sm text-muted-foreground">
                  {totalReviews.toLocaleString()} verified reviews
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-3">
                {[10, 9, 8, 7, 6].map((rating) => {
                  const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-4">
                      <div className="text-sm font-medium w-12 flex items-center gap-1">
                        {rating}
                        <Star className="h-3 w-3 fill-primary text-primary" />
                      </div>
                      <Progress value={percentage} className="flex-1" />
                      <div className="text-sm text-muted-foreground w-16 text-right">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Sort and Filter */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Guest reviews</h3>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="most_recent">Most recent</SelectItem>
                <SelectItem value="highest_rated">Highest rated</SelectItem>
                <SelectItem value="lowest_rated">Lowest rated</SelectItem>
                <SelectItem value="most_helpful">Most helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {displayedReviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex gap-4">
                  <Avatar className="h-12 w-12">
                    {review.avatar ? (
                      <AvatarImage src={review.avatar} alt={review.author} />
                    ) : (
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{review.author}</div>
                        <div className="text-sm text-muted-foreground">
                          {review.tripType} • {review.date}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-primary text-primary-foreground px-3 py-1 rounded font-bold">
                          {review.rating.toFixed(1)}
                        </div>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      {review.title && <h4 className="font-semibold mb-1">{review.title}</h4>}
                      <p className="text-sm text-muted-foreground">{review.content}</p>
                    </div>

                    {/* Photos */}
                    {review.photos && review.photos.length > 0 && (
                      <div className="flex gap-2">
                        {review.photos.map((photo, idx) => (
                          <div key={idx} className="w-24 h-24 rounded-lg overflow-hidden">
                            <img 
                              src={photo} 
                              alt={`Review photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                            loading="lazy"/>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    {review.helpful !== undefined && review.helpful > 0 && (
                      <div className="flex items-center gap-4 pt-2">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <ThumbsUp className="h-4 w-4" />
                          Helpful ({review.helpful})
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Load More */}
          {!showAll && sortedReviews.length > 10 && (
            <div className="text-center">
              <Button variant="outline" onClick={() => setShowAll(true)}>
                Show all {sortedReviews.length} reviews
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
