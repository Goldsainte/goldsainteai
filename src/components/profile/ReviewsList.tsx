import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
}

export function ReviewsList({ revieweeId, refreshKey }: ReviewsListProps) {
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

      // Fetch reviewer profiles
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

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-[#6B7280]">No reviews yet. Be the first to leave one!</p>
    );
  }

  return (
    <div className="space-y-4">
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
