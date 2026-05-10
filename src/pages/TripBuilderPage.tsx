import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Compass, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TripBuilderForm, type TripBuilderFormHandle } from "@/components/trips/TripBuilderForm";
import { BackButton } from "@/components/ui/BackButton";

export default function TripBuilderPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAgent, isCreator, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [saving, setSaving] = useState(false);
  const [tripData, setTripData] = useState<any>(null);
  const [loading, setLoading] = useState(!!editId);
  const formRef = useRef<TripBuilderFormHandle>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const handleSaveRef = useRef<typeof handleSave | null>(null);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) {
      navigate("/auth?mode=signin");
      return;
    }
    if (!isAgent && !isCreator) {
      toast.error("Only agents and creators can access the Trip Builder");
      navigate("/");
      return;
    }
  }, [user, isAgent, isCreator, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (editId && user) {
      loadTrip(editId);
    }
  }, [editId, user]);

  const loadTrip = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("packaged_trips")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      // Check ownership
      if (data.agent_id !== user?.id && data.creator_id !== user?.id) {
        toast.error("You don't have permission to edit this trip");
        navigate("/trip-builder");
        return;
      }
      
      setTripData(data);
    } catch (error: any) {
      toast.error("Failed to load trip: " + error.message);
      navigate("/trip-builder");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSave = async (formData: any, status: "draft" | "published") => {
    if (!user) return;

    try {
      setSaving(true);

      // Allow editing of pending/live trips — but resubmit goes back to pending_review
      let resubmitNotice: string | null = null;
      if (status === "published" && tripData?.status === "pending_review") {
        resubmitNotice = "Your trip is already in review — we'll update the submission.";
      }

      // Gate publishing on Stripe account for creators
      if (status === "published" && isCreator) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("stripe_account_id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.stripe_account_id) {
          toast.error("Please set up your payment account in the Earnings tab before publishing a trip.");
          setSaving(false);
          return;
        }
      }
      
      const slug = formData.slug || generateSlug(formData.title);

      // Map "published" submissions to "pending_review" — admin approves to go live.
      // Edits to a live trip also re-enter review while the existing listing stays live.
      let persistedStatus: "draft" | "pending_review" = status === "published" ? "pending_review" : "draft";
      if (status === "published" && tripData?.status === "published") {
        persistedStatus = "pending_review";
        resubmitNotice = "Your updates have been submitted for review. The current listing stays live until approved.";
      }

      // Pull itinerary days off the form payload — they live in their own table
      const { itinerary_days: itineraryDays = [], ...rest } = formData;

      const tripPayload: any = {
        ...rest,
        slug,
        status: persistedStatus,
        creator_type: isAgent ? "agent" : "creator",
        agent_id: isAgent ? user.id : null,
        creator_id: isCreator ? user.id : null,
        updated_at: new Date().toISOString(),
      };

      let tripId = editId;
      let savedSlug = slug;

      if (editId) {
        const { data: updated, error } = await supabase
          .from("packaged_trips")
          .update(tripPayload)
          .eq("id", editId)
          .select("id, slug")
          .single();
        if (error) throw error;
        savedSlug = updated.slug || slug;
      } else {
        const { data, error } = await supabase
          .from("packaged_trips")
          .insert(tripPayload)
          .select("id, slug")
          .single();
        if (error) throw error;
        tripId = data.id;
        savedSlug = data.slug || slug;
      }

      // Sync itinerary days — delete then insert
      if (tripId && Array.isArray(itineraryDays)) {
        const { error: delError } = await supabase
          .from("trip_itinerary_days")
          .delete()
          .eq("trip_id", tripId);
        if (delError) console.error("Failed to clear itinerary:", delError);

        const validDays = itineraryDays
          .filter((d: any) => d && (d.title?.trim() || d.description?.trim() || (d.activities?.length ?? 0) > 0 || d.accommodation?.trim()))
          .map((d: any) => ({
            trip_id: tripId,
            day_number: d.day_number,
            title: d.title || `Day ${d.day_number}`,
            description: d.description || null,
            activities: d.activities || [],
            meals_included: d.meals_included || [],
            accommodation: d.accommodation || null,
            is_featured_day: !!d.is_featured_day,
          }));

        if (validDays.length > 0) {
          const { error: insError } = await supabase
            .from("trip_itinerary_days")
            .insert(validDays);
          if (insError) console.error("Failed to insert itinerary:", insError);
        }
      }

      // Notify admins on first transition into pending_review
      if (persistedStatus === "pending_review" && tripId) {
        const { error: notifyErr } = await supabase.rpc("notify_admins_trip_pending_review", {
          _trip_id: tripId,
          _trip_title: formData.title || "Untitled trip",
        });
        if (notifyErr) console.error("Admin notification failed:", notifyErr);
      }

      if (persistedStatus === "pending_review") {
        toast.success(resubmitNotice ?? "Your trip has been submitted for review. We typically review listings within 24 hours and will notify you when it's live.");
      } else {
        toast.success("Draft saved");
      }

      if (!editId && tripId) {
        navigate(`/trip-builder?edit=${tripId}`, { replace: true });
      }
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Keep latest handleSave reachable from the autosave interval
  useEffect(() => {
    handleSaveRef.current = handleSave;
  });

  // Autosave drafts every 60s once a title exists
  useEffect(() => {
    if (authLoading || roleLoading || !user) return;
    const interval = setInterval(async () => {
      const data = formRef.current?.getCurrentData();
      if (data?.title && handleSaveRef.current) {
        try {
          await handleSaveRef.current(data, "draft");
          setLastSaved(new Date());
        } catch (e) {
          // silent — manual save still works
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [authLoading, roleLoading, user]);

  const handlePreview = async () => {
    if (editId && tripData) {
      window.open(`/marketplace/trip/${tripData.slug || editId}`, "_blank");
      return;
    }
    const currentData = formRef.current?.getCurrentData();
    if (!currentData?.title || !currentData?.destination) {
      toast.info("Add a title and destination first, then we can save and preview.");
      return;
    }
    toast.info("Saving draft and opening preview...");
    await handleSave(currentData, "draft");
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FDF9F0] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C7A962]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      {/* Editorial Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-16">
        {/* Back button - own row */}
        <div className="mb-6">
          <BackButton to={isAgent ? "/agent-dashboard" : "/creator-dashboard"} />
        </div>

        {/* Gold accent line */}
        <div className="w-16 h-0.5 bg-[#C7A962] mb-6" />

        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-[#E5DFC6] mb-4">
          <Compass className="h-4 w-4 text-[#C7A962]" />
          <span className="text-sm font-medium text-[#6B7280] tracking-wide">
            Trip Builder
          </span>
        </div>

        {/* Large serif title with italic brand */}
        <h1 className="font-secondary text-2xl sm:text-3xl md:text-4xl text-[#0a2225] tracking-tight">
          {editId ? "Edit Trip" : "Trip Builder"} by <em>Goldsainte AI</em>
        </h1>

        {lastSaved && (
          <p className="mt-2 text-xs text-[#9A9384]">
            Saved {formatDistanceToNow(lastSaved)} ago
          </p>
        )}

        {/* Descriptive caption */}
        <p className="mt-3 text-[#6B7280] text-base max-w-xl leading-relaxed">
          Create ready-to-book experiences for the marketplace. 
          Your curated trips inspire travelers and earn you commissions.
        </p>

        {/* Preview button for edit mode */}
        {editId && (
          <div className="mt-6">
            <Button 
              variant="outline" 
              onClick={handlePreview} 
              className="rounded-full px-6 border-[#E5DFC6] hover:bg-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Trip
            </Button>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 md:pb-16">
        <TripBuilderForm
          ref={formRef}
          initialData={tripData}
          onSave={handleSave}
          saving={saving}
          isEditing={!!editId}
        />
      </div>
    </div>
  );
}
