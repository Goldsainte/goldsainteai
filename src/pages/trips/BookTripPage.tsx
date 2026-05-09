import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function BookTripPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: trip, isLoading } = useQuery({
    queryKey: ["book-trip", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaged_trips")
        .select("id, title, price_per_person, currency, creator_id")
        .eq("id", id as string)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/book/${id}`)}`, { replace: true });
    }
  }, [user, id, navigate]);

  useEffect(() => {
    if (trip?.id) {
      navigate(`/trips/${trip.id}?book=true`, { replace: true });
    }
  }, [trip?.id, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f7f3ea" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#C7A962" }} />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f7f3ea" }}>
        <div className="text-center space-y-4">
          <h1 className="font-secondary text-2xl" style={{ color: "#0a2225" }}>Trip not found</h1>
          <button
            type="button"
            onClick={() => navigate("/marketplace")}
            className="text-sm underline"
            style={{ color: "#C7A962" }}
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return null;
}