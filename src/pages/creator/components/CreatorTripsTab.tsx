import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus, Pencil, Eye, ImageIcon, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CreatorTrip = {
  id: string;
  title: string | null;
  slug: string | null;
  destination: string | null;
  cover_image_url: string | null;
  status: string | null;
  price_per_person: number | null;
  created_at: string;
  booking_count: number | null;
  view_count: number | null;
};

const statusStyles: Record<string, string> = {
  draft: "bg-[#E5DFC6] text-[#0a2225]",
  pending_review: "bg-[#C7A962]/20 text-[#7a5e1f] border border-[#C7A962]/40",
  published: "bg-[#0c4d47] text-white",
  archived: "bg-[#6B7280]/20 text-[#6B7280]",
};

type TsT = (key: string, defaultValue: string) => string;
const statusLabel = (t: TsT): Record<string, string> => ({
  draft: t("dash.c.tsDraft", "Draft"),
  pending_review: t("dash.c.psReview", "In review"),
  published: t("dash.c.tsLive", "Live"),
  archived: t("dash.c.tsArchived", "Archived"),
});

export function CreatorTripsTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [trips, setTrips] = useState<CreatorTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CreatorTrip | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      // All statuses — a creator's own trips are visible here the moment they're
      // created (draft / in-review / live), even before admin approval to go live.
      const { data, error } = await supabase
        .from("packaged_trips")
        .select(
          "id, title, slug, destination, cover_image_url, status, price_per_person, created_at, booking_count, view_count",
        )
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) console.error("Error loading creator trips:", error);
      else setTrips((data ?? []) as CreatorTrip[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const unpublish = async (trip: CreatorTrip) => {
    setBusyId(trip.id);
    const { error } = await supabase
      .from("packaged_trips")
      .update({ status: "draft" })
      .eq("id", trip.id)
      .eq("creator_id", user!.id);
    setBusyId(null);
    if (error) { toast.error(t("dash.c.unpublishFailed", "Couldn't unpublish. Try again.")); return; }
    setTrips((prev) => prev.map((t) => (t.id === trip.id ? { ...t, status: "draft" } : t)));
    toast.success(t("dash.c.tourUnpublished", "Tour unpublished — it's now a draft and off the marketplace."));
  };

  const doDelete = async (trip: CreatorTrip) => {
    // Money-safe: a tour that has ever been booked can never be deleted, only
    // unpublished, so booking history keeps pointing at a real listing.
    if ((trip.booking_count ?? 0) > 0) {
      toast.error(t("dash.c.tourHasBookings", "This tour has bookings and can't be deleted — unpublish it instead."));
      setConfirmDelete(null);
      return;
    }
    setBusyId(trip.id);
    const { error } = await supabase
      .from("packaged_trips")
      .delete()
      .eq("id", trip.id)
      .eq("creator_id", user!.id);
    setBusyId(null);
    setConfirmDelete(null);
    if (error) { toast.error(t("dash.c.delTourFailed", "Couldn't delete. Try again.")); return; }
    setTrips((prev) => prev.filter((t) => t.id !== trip.id));
    toast.success(t("dash.c.tourDeleted", "Tour deleted."));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          {/* Product law: creators sell TOURS — noun-correct copy (item ① polish, Jul 25) */}
          <h2 className="font-secondary text-2xl text-[#0a2225]">{t("dash.c.myTours", "My Tours")}</h2>
          <p className="mt-1 text-[15px] text-[#6B7280] max-w-md">
            {t("dash.c.toursSub", "Create and manage bookable tours. New tours go to review before they're bookable on the marketplace — they appear here straight away.")}
          </p>
        </div>
        <Button
          onClick={() => navigate("/trip-builder")}
          className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d38] text-white px-6 self-start sm:self-auto shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("dash.c.createBookableTour", "Create Bookable Tour")}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#C7A962]" />
        </div>
      )}

      {!loading && trips.length === 0 && (
        <div className="rounded-3xl border border-dashed border-[#E5DFC6] bg-white/60 p-12 text-center">
          <p className="text-[15px] text-[#6B7280]">{t("dash.c.noToursYet", "You haven't created any tours yet.")}</p>
          <Button
            onClick={() => navigate("/trip-builder")}
            className="mt-4 rounded-full bg-[#0c4d47] hover:bg-[#0a3d38] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("dash.c.buildFirstTour", "Build your first tour")}
          </Button>
        </div>
      )}

      {!loading && trips.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {trips.map((trip) => {
            const status = trip.status || "draft";
            return (
              <article
                key={trip.id}
                className="rounded-2xl border border-[#E5DFC6] bg-white overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-[#F6F0E4] overflow-hidden">
                  {trip.cover_image_url ? (
                    <img
                      src={trip.cover_image_url}
                      alt={trip.title ?? t("dash.c.tripCoverAlt", "Trip cover")}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#8D8D8D]">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-secondary text-lg truncate">{trip.title || "Untitled trip"}</h3>
                      <p className="text-[13px] text-[#6B7280] truncate">{trip.destination || "Destination TBD"}</p>
                    </div>
                    <Badge
                      className={`${statusStyles[status] ?? statusStyles.draft} rounded-full text-[12px] uppercase tracking-wider px-2.5 py-0.5`}
                    >
                      {statusLabel(t)[status] ?? status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-[13px] text-[#6B7280]">
                    <span>
                      <strong className="text-[#0a2225]">{trip.booking_count ?? 0}</strong> bookings
                    </span>
                    <span>
                      <strong className="text-[#0a2225]">{trip.view_count ?? 0}</strong> views
                    </span>
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/trip-builder?edit=${trip.id}`)}
                      className="rounded-full border-[#E5DFC6] hover:bg-[#FDF9F0] text-[#0a2225] flex-1"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      {t("dash.c.edit", "Edit")}
                    </Button>
                    {status === "published" && (
                      <Link to={`/marketplace/trip/${trip.slug ?? trip.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-full border-[#0c4d47] text-[#0c4d47] hover:bg-[#0c4d47]/5"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          {t("dash.c.viewListing", "View Listing")}
                        </Button>
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {status === "published" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === trip.id}
                        onClick={() => unpublish(trip)}
                        className="rounded-full text-[#6B7280] hover:bg-[#F6F0E4] flex-1"
                      >
                        {busyId === trip.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <><EyeOff className="h-3.5 w-3.5 mr-1.5" />Unpublish</>
                        )}
                      </Button>
                    )}
                    {(trip.booking_count ?? 0) === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === trip.id}
                        onClick={() => setConfirmDelete(trip)}
                        className="rounded-full text-[#b4453c] hover:bg-[#b4453c]/10 flex-1"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        {t("dash.c.delete", "Delete")}
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dash.c.delTourTitle", "Delete this tour?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dash.c.delTourDesc", { title: confirmDelete?.title || t("dash.c.untitledTour", "Untitled tour"), defaultValue: "\"{{title}}\" will be permanently removed. This can't be undone." })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dash.c.keepIt", "Keep it")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && doDelete(confirmDelete)}
              className="bg-[#b4453c] hover:bg-[#9a3a32] text-white"
            >
              {t("dash.c.deleteTour", "Delete tour")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
