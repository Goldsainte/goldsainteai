import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ImageIcon, Loader2, Save, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Trip = {
  id: string;
  title: string | null;
  destination: string | null;
  cover_image_url: string | null;
  status: string | null;
};

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("packaged_trips")
        .select("id, title, destination, cover_image_url, status")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        toast.error("Failed to load trips");
      } else {
        setTrips((data ?? []) as Trip[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const approveTrip = async (trip: Trip) => {
    setApprovingId(trip.id);
    const { error } = await supabase
      .from("packaged_trips")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", trip.id);
    setApprovingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTrips((prev) => prev.map((t) => (t.id === trip.id ? { ...t, status: "published" } : t)));
    toast.success("Trip approved and published");
  };

  const visibleTrips = statusFilter === "all" ? trips : trips.filter((t) => (t.status || "draft") === statusFilter);

  const updateDraft = (id: string, url: string) =>
    setDrafts((prev) => ({ ...prev, [id]: url }));

  const saveCover = async (trip: Trip) => {
    const newUrl = (drafts[trip.id] ?? trip.cover_image_url ?? "").trim();
    if (!newUrl) {
      toast.error("Provide an image URL");
      return;
    }
    setSavingId(trip.id);
    const { error } = await supabase
      .from("packaged_trips")
      .update({ cover_image_url: newUrl })
      .eq("id", trip.id);
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTrips((prev) =>
      prev.map((t) => (t.id === trip.id ? { ...t, cover_image_url: newUrl } : t))
    );
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[trip.id];
      return next;
    });
    toast.success("Cover updated");
  };

  const uploadFile = async (trip: Trip, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Image must be under 50MB");
      return;
    }
    setUploadingId(trip.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Please sign in again and retry the upload");
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/trips/${trip.id}/cover-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("trip-assets")
        .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("trip-assets").getPublicUrl(path);
      updateDraft(trip.id, urlData.publicUrl);
      await supabase
        .from("packaged_trips")
        .update({ cover_image_url: urlData.publicUrl })
        .eq("id", trip.id);
      setTrips((prev) =>
        prev.map((t) => (t.id === trip.id ? { ...t, cover_image_url: urlData.publicUrl } : t))
      );
      toast.success("Cover uploaded");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Marketplace trip photos · Admin</title>
      </Helmet>
      <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225] px-6 py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white/80 px-4 py-1 text-[11px]">
              <ImageIcon className="h-3 w-3 text-[#0c4d47]" />
              Marketplace trip photos
            </div>
            <h1 className="font-secondary text-2xl md:text-3xl">Edit trip cover photos</h1>
            <p className="text-sm text-[#4a4a4a] max-w-2xl">
              Update the cover image for any marketplace trip. Paste an image URL or upload a new file.
            </p>
          </header>

          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-[#6B7280]">Filter by status</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] h-9 rounded-full border-[#E5DFC6] bg-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5DFC6] rounded-xl">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-sm text-[#4a4a4a]">Loading trips…</p>
          ) : visibleTrips.length === 0 ? (
            <p className="text-sm text-[#4a4a4a]">No trips found.</p>
          ) : (
            <ul className="space-y-4">
              {visibleTrips.map((trip) => {
                const draft = drafts[trip.id] ?? trip.cover_image_url ?? "";
                const status = trip.status || "draft";
                return (
                  <li
                    key={trip.id}
                    className="flex flex-col gap-4 rounded-3xl border border-[#E5DFC6] bg-white/90 p-4 md:flex-row md:items-center"
                  >
                    <div className="h-28 w-40 flex-shrink-0 overflow-hidden rounded-2xl bg-[#F6F0E4]">
                      {trip.cover_image_url ? (
                        <img
                          src={trip.cover_image_url}
                          alt={trip.title ?? "Trip cover"}
                          className="h-full w-full object-cover"
                        loading="lazy"/>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[#8D8D8D]">
                          No cover
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{trip.title || "Untitled trip"}</p>
                          {status === "pending_review" && (
                            <Badge className="bg-[#C7A962]/20 text-[#7a5e1f] border border-[#C7A962]/40 rounded-full text-[10px] uppercase tracking-wider">
                              Pending Review
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#8D8D8D]">
                          {trip.destination || "—"} · {status}
                        </p>
                      </div>
                      {status === "pending_review" && (
                        <Button
                          onClick={() => approveTrip(trip)}
                          disabled={approvingId === trip.id}
                          size="sm"
                          className="bg-[#0c4d47] text-white hover:bg-[#0a3d38] rounded-full"
                        >
                          {approvingId === trip.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                          )}
                          Approve & Publish
                        </Button>
                      )}
                      <div className="flex flex-col gap-2 md:flex-row">
                        <div
                          className="h-[100px] w-[160px] flex-shrink-0 overflow-hidden rounded-xl border border-[#E5DFC6] bg-[#F6F0E4]"
                          aria-label="Live preview"
                        >
                          {draft ? (
                            <img key={draft}
                              src={draft}
                              alt="Live preview"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const img = e.currentTarget;
                                img.style.display = "none";
                                const sib = img.nextElementSibling as HTMLElement | null;
                                if (sib) sib.style.display = "flex";
                              }}
                              onLoad={(e) => {
                                const img = e.currentTarget;
                                img.style.display = "block";
                                const sib = img.nextElementSibling as HTMLElement | null;
                                if (sib) sib.style.display = "none";
                              }} loading="lazy" />
                          ) : null}
                          <div
                            className="h-full w-full items-center justify-center text-[10px] uppercase tracking-wider text-[#b34a3a]"
                            style={{ display: draft ? "none" : "flex" }}
                          >
                            {draft ? "Broken image" : "No preview"}
                          </div>
                        </div>
                        <Input
                          value={draft}
                          onChange={(e) => updateDraft(trip.id, e.target.value)}
                          placeholder="Image URL"
                          className="flex-1"
                        />
                        <Button
                          onClick={() => saveCover(trip)}
                          disabled={savingId === trip.id}
                          className="bg-[#0c4d47] text-white hover:bg-[#0a3d38]"
                        >
                          {savingId === trip.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span className="ml-2">Save</span>
                        </Button>
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[#E5DFC6] bg-white px-3 py-2 text-sm hover:bg-[#F6F0E4]">
                          {uploadingId === trip.id ? "Uploading…" : "Upload"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadFile(trip, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
