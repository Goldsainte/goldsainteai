import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, Image as ImageIcon, MapPin } from "lucide-react";
import { toast } from "sonner";
import { TripBuilderForm, type TripBuilderFormHandle } from "@/components/trips/TripBuilderForm";
import { BackButton } from "@/components/ui/BackButton";

export default function TripBuilderPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAgent, isCreator, isBrand, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [saving, setSaving] = useState(false);
  const [tripData, setTripData] = useState<any>(null);
  const [loading, setLoading] = useState(!!editId);
  const formRef = useRef<TripBuilderFormHandle>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const handleSaveRef = useRef<((data: any, status: "draft" | "published") => Promise<string | null>) | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  // Poll the form ref for the latest data so the live preview updates as the user types
  useEffect(() => {
    const interval = setInterval(() => {
      const data = formRef.current?.getCurrentData?.();
      if (data) setPreviewData(data);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) {
      navigate("/auth?mode=signin");
      return;
    }
    if (!isAgent && !isCreator && !isBrand) {
      toast.error("Only agents and creators can access the Trip Builder");
      navigate("/");
      return;
    }
  }, [user, isAgent, isCreator, isBrand, authLoading, roleLoading, navigate]);

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

  const handleSave = async (formData: any, status: "draft" | "published"): Promise<string | null> => {
    if (!user) return null;

    try {
      setSaving(true);

      // Allow editing of pending/live trips — but resubmit goes back to pending_review
      let resubmitNotice: string | null = null;
      if (status === "published" && tripData?.status === "pending_review") {
        resubmitNotice = "Your trip is already in review — we'll update the submission.";
      }

      // No Stripe gate on submission: a "publish" action maps to `pending_review`
      // (admin review, below) — the trip does NOT go live here, so Stripe is not
      // required to submit. Payout setup is enforced at go-live / first payout
      // instead; creators are nudged via the Earnings tab + Getting-Started checklist.
      // (This also avoids the stale-`stripe_charges_enabled` mismatch where the
      // profile showed Stripe connected but submission said "not linked".)

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
        // Ownership matrix (mirrored in RLS): tour operators own via brand_id
        // and may only create tours; agents own via agent_id, trips only;
        // creators own via creator_id and may create either.
        creator_type: isBrand ? "tour_operator" : isAgent ? "agent" : "creator",
        agent_id: isAgent ? user.id : null,
        creator_id: isCreator ? user.id : null,
        brand_id: isBrand ? user.id : null,
        updated_at: new Date().toISOString(),
      };
      if (isBrand) tripPayload.listing_type = "tour";
      if (isAgent && !isCreator) tripPayload.listing_type = "trip";

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
        // Send agent confirmation email (best-effort, non-blocking)
        if (user?.email) {
          supabase.functions.invoke("send-agent-submission-email", {
            body: {
              agentEmail: user.email,
              agentName: (user as any)?.user_metadata?.full_name || "there",
              tripTitle: formData?.title || "Your trip",
              tripId,
            },
          }).catch((e) => console.error("submission email failed:", e));
        }
      } else {
        toast.success("Draft saved");
      }

      if (!editId && tripId) {
        navigate(`/trip-builder?edit=${tripId}`, { replace: true });
      }
      return tripId ?? null;
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
      return null;
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
          const savedId = await handleSaveRef.current(data, "draft");
          setLastSaved(new Date());
          if (savedId && !editId) {
            navigate(`/trip-builder?edit=${savedId}`, { replace: true });
          }
        } catch (e) {
          // silent — manual save still works
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [authLoading, roleLoading, user, editId, navigate]);

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
      {/* Compact workspace header — Back row + a tight title/actions bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-4 md:pt-6 md:pb-5">
        <div className="mb-3">
          <BackButton to={isAgent ? "/agent-dashboard" : "/creator-dashboard"} />
          <div className="mt-4 rounded-2xl border border-[#C7A962]/40 bg-[#C7A962]/10 px-4 py-3 text-sm text-[#0a2225] leading-relaxed">
            <span className="font-medium">How publishing works:</span> trips are reviewed by
            Goldsainte before going live — typically within 24 hours — and Stripe payout
            verification must be complete before a trip can be approved. Drafts save anytime.
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <h1 className="font-secondary text-xl sm:text-2xl text-[#0a2225] tracking-tight truncate">
              {editId ? "Edit Trip" : "New Trip"}
            </h1>
            {lastSaved && (
              <span className="text-xs text-[#9A9384] shrink-0">
                Saved {formatDistanceToNow(lastSaved)} ago
              </span>
            )}
          </div>

          {editId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="rounded-full border-[#E5DFC6] hover:bg-white shrink-0"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Trip
            </Button>
          )}
        </div>
      </div>

      {/* Form + live preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 md:pb-16">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <TripBuilderForm
              ref={formRef}
              initialData={tripData}
              onSave={handleSave}
              saving={saving}
              isEditing={!!editId}
              listingKind={isBrand ? "tour" : "trip"}
              allowListingChoice={isCreator && !isBrand}
            />
          </div>
          <div className="hidden lg:flex flex-col w-60 flex-shrink-0">
            <div className="sticky top-8">
              <p className="eyebrow mb-4">Live preview</p>
              <div className="rounded-2xl overflow-hidden border border-[#E5DFC6] shadow-sm">
                <div className="aspect-video bg-[#F5F0E8] relative overflow-hidden">
                  {previewData?.cover_image_url ? (
                    <img src={previewData.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-[#E5DFC6]" />
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white">
                  <p className="font-medium text-sm text-[#0a2225] truncate">
                    {previewData?.title || "Your trip title"}
                  </p>
                  <p className="text-xs text-[#9A9384] mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {previewData?.destination || "Destination"}
                  </p>
                  <p className="text-sm font-semibold text-[#0a2225] mt-3">
                    {previewData?.price_per_person
                      ? `$${Number(previewData.price_per_person).toLocaleString()}`
                      : "$0"}{" "}
                    <span className="text-xs font-normal text-[#9A9384]">per person</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#9A9384] mt-3 text-center">
                This is how your trip appears in the marketplace
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
