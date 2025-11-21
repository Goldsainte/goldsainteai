import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NewTripForYouCard } from "@/components/trips/NewTripForYouCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TripMatch {
  id: string;
  trip_request_id: string;
  candidate_profile_id: string;
  match_score: number;
  reasons: string;
  status: "new" | "accepted" | "declined";
  created_at: string;
  trip_requests: {
    id: string;
    source_brand_profile_id: string | null;
    source_collection_id: string | null;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    travelers_adults: number | null;
    travelers_children: number | null;
    budget_min: number | null;
    budget_max: number | null;
    status: string;
    source_metadata: any;
  };
}

export default function MyTripMatchesPage() {
  const [matches, setMatches] = useState<TripMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("trip_request_matches")
        .select(`
          id,
          trip_request_id,
          candidate_profile_id,
          match_score,
          reasons,
          status,
          created_at,
          trip_requests!inner (
            id,
            source_brand_profile_id,
            source_collection_id,
            destination,
            start_date,
            end_date,
            travelers_adults,
            travelers_children,
            budget_min,
            budget_max,
            status,
            source_metadata
          )
        `)
        .eq("candidate_profile_id", user.id)
        .in("status", ["new", "accepted"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading matches:", error);
        toast({
          title: "Error",
          description: "Failed to load trip matches",
          variant: "destructive",
        });
        return;
      }

      setMatches((data || []) as TripMatch[]);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(matchId: string, status: "accepted" | "declined") {
    try {
      setUpdating(matchId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Please sign in to continue",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-trip-match-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ matchId, status }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update status");
      }

      toast({
        title: "Success",
        description: status === "accepted" 
          ? "Trip accepted! You can now start collaborating." 
          : "Trip declined.",
      });

      // Reload matches
      await loadMatches();
    } catch (err: any) {
      console.error("Error updating status:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update trip status",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#BFAD72]" />
      </div>
    );
  }

  const newMatches = matches.filter((m) => m.status === "new");
  const acceptedMatches = matches.filter((m) => m.status === "accepted");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-secondary text-3xl text-[#0a2225]">My Trip Matches</h1>
        <p className="mt-2 text-sm text-[#6E6650]">
          Trips matched to your profile based on style, expertise, and location
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-[#E5DFC6] bg-[#FDFBF5] p-8 text-center">
          <p className="text-[#6E6650]">No trip matches yet.</p>
          <p className="mt-2 text-sm text-[#8C8470]">
            Complete your profile to receive personalized trip recommendations
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {newMatches.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#A4987C]">
                New Opportunities ({newMatches.length})
              </h2>
              <div className="space-y-4">
                {newMatches.map((match) => {
                  const metadata = match.trip_requests.source_metadata || {};
                  const brandName = metadata.brand_name || "Unknown Brand";
                  const collectionTitle = metadata.collection_title || "Trip Request";
                  const tags = metadata.tags || [];

                  const dateRange = match.trip_requests.start_date && match.trip_requests.end_date
                    ? `${new Date(match.trip_requests.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(match.trip_requests.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : null;

                  const travelers = 
                    (match.trip_requests.travelers_adults || 0) + 
                    (match.trip_requests.travelers_children || 0);

                  const budgetRange = match.trip_requests.budget_min && match.trip_requests.budget_max
                    ? `$${match.trip_requests.budget_min.toLocaleString()} – $${match.trip_requests.budget_max.toLocaleString()}`
                    : null;

                  return (
                    <NewTripForYouCard
                      key={match.id}
                      matchId={match.id}
                      tripRequestId={match.trip_request_id}
                      createdAt={match.created_at}
                      sourceBrandProfileId={match.trip_requests.source_brand_profile_id || ""}
                      brandName={brandName}
                      sourceCollectionId={match.trip_requests.source_collection_id}
                      collectionTitle={collectionTitle}
                      collectionTags={tags}
                      destination={match.trip_requests.destination}
                      dateRange={dateRange}
                      travelersCount={travelers}
                      budgetRange={budgetRange}
                      status={match.trip_requests.status as any}
                      matchScore={match.match_score}
                      matchReasons={match.reasons}
                      matchStatus={match.status}
                      onOpenRequest={() => navigate(`/trip-requests/${match.trip_request_id}`)}
                      onAccept={() => handleUpdateStatus(match.id, "accepted")}
                      onDecline={() => handleUpdateStatus(match.id, "declined")}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {acceptedMatches.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#A4987C]">
                Accepted Trips ({acceptedMatches.length})
              </h2>
              <div className="space-y-4">
                {acceptedMatches.map((match) => {
                  const metadata = match.trip_requests.source_metadata || {};
                  const brandName = metadata.brand_name || "Unknown Brand";
                  const collectionTitle = metadata.collection_title || "Trip Request";
                  const tags = metadata.tags || [];

                  const dateRange = match.trip_requests.start_date && match.trip_requests.end_date
                    ? `${new Date(match.trip_requests.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(match.trip_requests.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : null;

                  const travelers = 
                    (match.trip_requests.travelers_adults || 0) + 
                    (match.trip_requests.travelers_children || 0);

                  const budgetRange = match.trip_requests.budget_min && match.trip_requests.budget_max
                    ? `$${match.trip_requests.budget_min.toLocaleString()} – $${match.trip_requests.budget_max.toLocaleString()}`
                    : null;

                  return (
                    <NewTripForYouCard
                      key={match.id}
                      matchId={match.id}
                      tripRequestId={match.trip_request_id}
                      createdAt={match.created_at}
                      sourceBrandProfileId={match.trip_requests.source_brand_profile_id || ""}
                      brandName={brandName}
                      sourceCollectionId={match.trip_requests.source_collection_id}
                      collectionTitle={collectionTitle}
                      collectionTags={tags}
                      destination={match.trip_requests.destination}
                      dateRange={dateRange}
                      travelersCount={travelers}
                      budgetRange={budgetRange}
                      status={match.trip_requests.status as any}
                      matchScore={match.match_score}
                      matchReasons={match.reasons}
                      matchStatus={match.status}
                      onOpenRequest={() => navigate(`/trip-requests/${match.trip_request_id}`)}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {updating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="rounded-2xl bg-white p-6 shadow-xl">
            <Loader2 className="h-6 w-6 animate-spin text-[#BFAD72]" />
          </div>
        </div>
      )}
    </div>
  );
}
