import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WriteReviewModalProps {
  revieweeId: string;
  revieweeName: string;
  onSuccess?: () => void;
  children: React.ReactNode;
}

export function WriteReviewModal({ revieweeId, revieweeName, onSuccess, children }: WriteReviewModalProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Reviews are reserved for travelers who have actually booked with this
  // person. null = checking, false = not eligible, true = eligible.
  const [eligible, setEligible] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("trip_bookings")
        .select("id")
        .eq("traveler_id", user.id)
        .eq("partner_id", revieweeId)
        .in("status", ["confirmed", "paid_in_full", "completed"])
        .limit(1);
      if (!cancelled) setEligible(!!data && data.length > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user, revieweeId]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Sign in to leave a review");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (eligible === false) {
      toast.error(`Reviews are reserved for travelers who've booked with ${revieweeName}.`);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("profile_reviews").insert({
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast.success("Review submitted!");
      setOpen(false);
      setRating(0);
      setComment("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review {revieweeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Star rating */}
          <div>
            {eligible === false && (
              <div className="rounded-xl border border-[#E5DFC6] bg-[#FDF9F0] p-4 mb-2">
                <p className="text-sm text-[#0a2225]/70 leading-relaxed">
                  Reviews are reserved for travelers who have booked with{" "}
                  {revieweeName} through Goldsainte. Once you complete a
                  journey together, you can share your experience here.
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-2">Your rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-7 w-7",
                      star <= (hoveredRating || rating)
                        ? "fill-[#C7A962] text-[#C7A962]"
                        : "fill-none text-[#E5DFC6]"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Your review (optional)</p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="min-h-[100px]"
              maxLength={1000}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || eligible !== true}
            className="w-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
