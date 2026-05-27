import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionUrl } from "@/lib/backendConfig";
import { NewTripForYouCard } from "@/components/trips/NewTripForYouCard";
import { InProgressTripCard } from "@/components/trips/InProgressTripCard";
import { CompletedTripCard } from "@/components/trips/CompletedTripCard";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type TripStatus = "new" | "in_progress" | "completed";

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

const TabPill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-full px-4 py-1.5",
      active
        ? "bg-[#0a2225] text-[#FDFBF5]"
        : "text-[#6E6650] hover:bg-[#F5EFE1]"
    )}
  >
    {children}
  </button>
);

export default function MyTripMatchesPage() {
  const [matches, setMatches] = useState<TripMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TripStatus>("new");
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
        getEdgeFunctionUrl("update-trip-match-status"),
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
  const inProgressMatches = matches.filter((m) => m.status === "accepted");
  const completedMatches = matches.filter((m) => m.trip_requests.status === "completed");

  const renderContent = () => {
    if (activeTab === "new") {
      if (!newMatches.length) {
        return (
          <p className="mt-6 text-sm text-[#6E6650]">
            No new trips right now. New matches will appear here as travelers
            request journeys aligned with your style.
          </p>
        );
      }
      return (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
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
      );
    }

    if (activeTab === "in_progress") {
      if (!inProgressMatches.length) {
        return (
          <p className="mt-6 text-sm text-[#6E6650]">
            Trips move here once you accept them and begin working with the traveler.
          </p>
        );
      }
      return (
        <div className="mt-6 space-y-4">
          {inProgressMatches.map((match) => {
            const metadata = match.trip_requests.source_metadata || {};
            const brandName = metadata.brand_name || "Unknown Brand";
            const collectionTitle = metadata.collection_title || "Trip Request";

            const dateRange = match.trip_requests.start_date && match.trip_requests.end_date
              ? `${new Date(match.trip_requests.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(match.trip_requests.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : null;

            const budgetRange = match.trip_requests.budget_min && match.trip_requests.budget_max
              ? `$${match.trip_requests.budget_min.toLocaleString()} – $${match.trip_requests.budget_max.toLocaleString()}`
              : null;

            return (
              <InProgressTripCard
                key={match.id}
                collectionTitle={collectionTitle}
                brandName={brandName}
                notes={metadata.notes}
                checkIn={dateRange?.split(" – ")[0]}
                checkOut={dateRange?.split(" – ")[1]}
                budgetRange={budgetRange}
              />
            );
          })}
        </div>
      );
    }

    if (!completedMatches.length) {
      return (
        <p className="mt-6 text-sm text-[#6E6650]">
          Once a trip is marked completed, it will appear here.
        </p>
      );
    }
    return (
      <div className="mt-6 space-y-4">
        {completedMatches.map((match) => {
          const metadata = match.trip_requests.source_metadata || {};
          const brandName = metadata.brand_name || "Unknown Brand";
          const collectionTitle = metadata.collection_title || "Trip Request";

          return (
            <CompletedTripCard
              key={match.id}
              collectionTitle={collectionTitle}
              brandName={brandName}
              notes={metadata.notes}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#FDF9F0] pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-10">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A4987C]">Trips</p>
            <h1 className="font-secondary text-2xl text-[#0a2225] md:text-3xl">
              Trips aligned with your style
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#6E6650]">
              New matches arrive here when a traveler's brief and a brand collection fit your world. 
              Accept what feels right, then move trips forward in your own cadence.
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-full border border-[#E5DFC6] bg-[#FDFBF5] p-1 text-[12px]">
          <TabPill active={activeTab === "new"} onClick={() => setActiveTab("new")}>
            New
          </TabPill>
          <TabPill active={activeTab === "in_progress"} onClick={() => setActiveTab("in_progress")}>
            In progress
          </TabPill>
          <TabPill active={activeTab === "completed"} onClick={() => setActiveTab("completed")}>
            Completed
          </TabPill>
        </div>

        {renderContent()}
      </div>

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
