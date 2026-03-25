import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
}

interface ReviewsListProps {
  revieweeId: string;
  refreshKey?: number;
  avgRating?: number | null;
  reviewCount?: number;
  onWriteReview?: () => void;
  showWriteReviewCTA?: boolean;
}

export function ReviewsList({
  revieweeId,
  refreshKey,
  avgRating,
  reviewCount = 0,
  onWriteReview,
  showWriteReviewCTA = false,
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profile_reviews")
        .select("id, rating, comment, created_at, reviewer_id")
        .eq("reviewee_id", revieweeId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching reviews:", error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }

      const reviewerIds = data.map((r) => r.reviewer_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", reviewerIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      setReviews(
        data.map((r) => ({
          ...r,
          reviewer_name: profileMap.get(r.reviewer_id)?.full_name || "Anonymous",
          reviewer_avatar: profileMap.get(r.reviewer_id)?.avatar_url || null,
        }))
      );
      setLoading(false);
    })();
  }, [revieweeId, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl bg-[#E5DFC6]/30 h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rating summary bar */}
      <div className="rounded-xl border border-[#E5DFC6] bg-white p-4 flex items-center gap-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-5 w-5",
                avgRating && star <= Math.round(avgRating)
                  ? "fill-[#C7A962] text-[#C7A962]"
                  : "fill-[#E5DFC6] text-[#E5DFC6]"
              )}
            />
          ))}
        </div>
        <div className="flex-1">
          {reviewCount > 0 ? (
            <p className="text-sm text-[#0a2225]">
              <span className="font-semibold">{avgRating?.toFixed(1)}</span>
              <span className="text-[#6B7280]"> · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}</span>
            </p>
          ) : (
            <p className="text-sm text-[#6B7280]">No reviews yet</p>
          )}
        </div>
        {showWriteReviewCTA && onWriteReview && (
          <Button
            variant="outline"
            size="sm"
            onClick={onWriteReview}
            className="border-[#E5DFC6] text-[#0a2225] shrink-0"
          >
            <PenLine className="mr-1.5 h-3.5 w-3.5" />
            {reviewCount === 0 ? "Be the first" : "Write a review"}
          </Button>
        )}
      </div>

      {/* Reviews list */}
      {reviews.map((review) => (
        <div
          key={review.id}
          className="rounded-xl border border-[#E5DFC6] bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={review.reviewer_avatar || undefined} />
              <AvatarFallback className="bg-[#F5F0E0] text-[#0a2225] text-xs">
                {(review.reviewer_name || "A").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#0a2225]">
                  {review.reviewer_name}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {format(new Date(review.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-3.5 w-3.5",
                      star <= review.rating
                        ? "fill-[#C7A962] text-[#C7A962]"
                        : "fill-[#E5DFC6] text-[#E5DFC6]"
                    )}
                  />
                ))}
              </div>
              {review.comment && (
                <p className="mt-2 text-sm text-[#4a4a4a] leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
