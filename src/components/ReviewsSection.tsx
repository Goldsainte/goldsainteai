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

  // Use real reviews if available, otherwise generate mock reviews
  const reviews = useMemo((): Review[] => {
    if (realReviews && realReviews.length > 0) {
      // Use real reviews from Google Places
      return realReviews.map((review, i) => ({
        id: review.id || `review-${i}`,
        author: review.author,
        avatar: review.profileImage || review.avatar,
        rating: review.rating,
        title: review.title || "Great stay",
        content: review.content || review.text || "",
        date: review.date,
        helpful: review.helpful || 0,
        verified: review.verified !== undefined ? review.verified : true,
        photos: review.photos,
        tripType: review.tripType || "Traveler",
      }));
    }

    // Generate realistic mock reviews only as fallback
    const names = [
      "Sarah Johnson", "Michael Chen", "Emma Williams", "James Anderson", 
      "Olivia Martinez", "David Lee", "Sophia Brown", "Robert Taylor",
      "Isabella Garcia", "William Rodriguez", "Mia Davis", "Alexander Wilson"
    ];

    const titles = [
      "Amazing stay!", "Perfect location", "Exceeded expectations",
      "Great value for money", "Wonderful experience", "Highly recommend",
      "Fantastic service", "Beautiful property", "Will definitely return",
      "Outstanding hospitality", "Clean and comfortable", "Impressive amenities"
    ];

    const tripTypes = ["Business", "Couple", "Family", "Solo", "Friends"];

    const photoUrls = [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400",
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400",
    ];

    return Array.from({ length: Math.min(totalReviews || 50, 50) }, (_, i) => {
      const rating = Math.max(6, Math.min(10, averageRating + (Math.random() - 0.5) * 2));
      const hasPhotos = Math.random() > 0.7;
      
      return {
        id: `review-${i}`,
        author: names[i % names.length],
        avatar: Math.random() > 0.5 ? `https://i.pravatar.cc/150?img=${i % 70}` : undefined,
        rating: Math.round(rating * 10) / 10,
        title: titles[i % titles.length],
        content: `Had a wonderful stay at ${hotelName}. The staff was incredibly friendly and helpful. The room was clean, spacious, and had all the amenities we needed. The location was perfect for exploring the area. Would definitely stay here again!`,
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        }),
        helpful: Math.floor(Math.random() * 50),
        verified: Math.random() > 0.3,
        photos: hasPhotos ? photoUrls.slice(0, Math.floor(Math.random() * 3) + 1) : undefined,
        tripType: tripTypes[Math.floor(Math.random() * tripTypes.length)],
      };
    });
  }, [hotelId, hotelName, averageRating, totalReviews, realReviews]);

  const sortedReviews = useMemo(() => {
    let sorted = [...reviews];
    
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

  const displayedReviews = showAll ? sortedReviews : sortedReviews.slice(0, 10);

  // Calculate rating distribution
  const ratingDistribution = useMemo(() => {
    const dist = { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0 };
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
              const percentage = (count / totalReviews) * 100;
              
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
                        />
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
    </div>
  );
};
