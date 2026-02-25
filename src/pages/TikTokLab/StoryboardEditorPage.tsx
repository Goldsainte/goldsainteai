import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { ArrowLeft, Globe, Lock, Pencil, CalendarDays, ImageIcon, ArrowRight } from "lucide-react";
import { StoryboardBuilder } from "@/components/storyboards/StoryboardBuilder";
import { TravelStoryboard } from "@/components/storyboards/TravelStoryboard";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type StoryboardData = {
  id: string;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  cover_image_url: string | null;
  is_public: boolean | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  trip_request_id?: string | null;
  owner_id: string | null;
  [key: string]: any;
};

export default function StoryboardEditorPage() {
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const effectiveMode: "create" | "edit" = params.id ? "edit" : "create";
  const storyboardId = params.id;

  const [initialTitle, setInitialTitle] = useState("");
  const [storyboard, setStoryboard] = useState<StoryboardData | null>(null);
  const [loadingStoryboard, setLoadingStoryboard] = useState(!!storyboardId);
  const [itemCount, setItemCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editPublic, setEditPublic] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const titleFromQuery = searchParams.get("title");
    if (titleFromQuery) {
      setInitialTitle(titleFromQuery);
    }
  }, [location.search]);

  useEffect(() => {
    if (!storyboardId) {
      setLoadingStoryboard(false);
      return;
    }

    (async () => {
      const [sbResult, countResult] = await Promise.all([
        supabase
          .from("storyboards")
          .select("*")
          .eq("id", storyboardId)
          .single(),
        supabase
          .from("storyboard_items")
          .select("id", { count: "exact", head: true })
          .eq("storyboard_id", storyboardId),
      ]);

      if (sbResult.error) {
        console.error("Error loading storyboard:", sbResult.error);
        setLoadingStoryboard(false);
        return;
      }

      setStoryboard(sbResult.data as StoryboardData);
      setItemCount(countResult.count || 0);
      setLoadingStoryboard(false);
    })();
  }, [storyboardId]);

  function openEditDialog() {
    if (!storyboard) return;
    setEditTitle(storyboard.title || "");
    setEditDescription(storyboard.description || "");
    setEditTags((storyboard.tags || []).join(", "));
    setEditPublic(storyboard.is_public ?? false);
    setEditOpen(true);
  }

  async function saveDetails() {
    if (!storyboardId) return;
    setEditSaving(true);
    const tags = editTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("storyboards")
      .update({
        title: editTitle.trim() || null,
        description: editDescription.trim() || null,
        tags: tags.length > 0 ? tags : null,
        is_public: editPublic,
      })
      .eq("id", storyboardId);

    if (!error) {
      setStoryboard((prev) =>
        prev
          ? {
              ...prev,
              title: editTitle.trim() || null,
              description: editDescription.trim() || null,
              tags: tags.length > 0 ? tags : null,
              is_public: editPublic,
            }
          : prev
      );
      setEditOpen(false);
    }
    setEditSaving(false);
  }

  function handleStoryboardSaved(id: string) {
    navigate("/storyboards");
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/storyboards"
          className="mb-6 inline-flex items-center gap-2 text-[11px] text-[#4a4a4a] hover:text-[#0a2225]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to storyboards
        </Link>

        {/* Concierge origin banner */}
        {storyboard && storyboard.related_concierge_session_id && !loadingStoryboard && (
          <div className="mb-4 rounded-2xl border border-[#E5DFC6] bg-white/90 px-3 py-2 text-[11px] flex flex-wrap items-center justify-between gap-2">
            <div className="text-[#4a4a4a]">
              <span className="font-semibold text-[#0a2225]">
                Created from your conversation with Madison
              </span>
              <span className="text-[#8D8D8D]">
                {" "}· {formatDate(storyboard.created_at)}
              </span>
            </div>
            <Link
              to={`/concierge?sessionId=${storyboard.related_concierge_session_id}`}
              className="text-[10px] font-semibold text-[#0c4d47] underline underline-offset-2 hover:text-[#073331]"
            >
              View that concierge thread
            </Link>
          </div>
        )}

        {/* ── Detail Hero Section (edit mode only) ── */}
        {effectiveMode === "edit" && storyboard && !loadingStoryboard && (
          <div className="mb-6 rounded-[32px] border border-[#E5DFC6] bg-white/95 overflow-hidden">
            {/* Cover image */}
            {storyboard.cover_image_url ? (
              <div className="relative aspect-[21/9] w-full">
                <img
                  src={storyboard.cover_image_url}
                  alt={storyboard.title || "Storyboard cover"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="relative aspect-[21/9] w-full bg-gradient-to-br from-[#e8e0cc] to-[#d4cbb3] flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-[#b5a88a]" />
              </div>
            )}

            {/* Details */}
            <div className="px-5 py-5 md:px-6">
              <h1 className="font-display text-2xl md:text-[28px] text-[#0a2225] leading-tight">
                {storyboard.title || "Untitled Storyboard"}
              </h1>

              {storyboard.description && (
                <p className="mt-2 text-[13px] leading-relaxed text-[#4a4a4a]">
                  {storyboard.description}
                </p>
              )}

              {/* Tags */}
              {storyboard.tags && storyboard.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {storyboard.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-full bg-[#f7f3ea] text-[#4a4a4a] border border-[#E5DFC6] text-[10px] px-2.5 py-0.5 font-medium"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Meta row */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-[#8D8D8D]">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Created {formatDate(storyboard.created_at)}
                </span>
                {storyboard.updated_at !== storyboard.created_at && (
                  <span>· Updated {formatDate(storyboard.updated_at)}</span>
                )}
                <span>· {itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                <span className="inline-flex items-center gap-1">
                  {storyboard.is_public ? (
                    <>
                      <Globe className="h-3 w-3" /> Public
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" /> Private
                    </>
                  )}
                </span>
                {storyboard.role && (
                  <Badge
                    variant="outline"
                    className="text-[10px] capitalize border-[#E5DFC6]"
                  >
                    {storyboard.role}
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEditDialog}
                  className="rounded-full text-[11px] border-[#E5DFC6] text-[#0a2225] hover:bg-[#f7f3ea]"
                >
                  <Pencil className="h-3 w-3 mr-1" /> Edit Details
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  className="rounded-full text-[11px] bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6]"
                >
                  <Link to={`/post-trip?fromStoryboard=${storyboardId}`}>
                    Convert to Trip <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create mode heading */}
        {effectiveMode === "create" && (
          <div className="mb-6">
            <h1 className="font-display text-[28px] text-[#0a2225]">
              Create Storyboard
            </h1>
            <p className="mt-2 text-[13px] text-[#4a4a4a]">
              Build a visual storyboard with photos, experiences, and links to inspire your trips and packages.
            </p>
          </div>
        )}

        <StoryboardBuilder
          storyboardId={storyboardId}
          initialTitle={storyboard?.title || initialTitle}
          mode="creator"
          onSaved={handleStoryboardSaved}
        />

        {/* Browse Inspiration section */}
        {effectiveMode === "create" && (
          <div className="mt-10 pt-8 border-t border-[#E5DFC6]">
            <TravelStoryboard
              title="Browse Inspiration"
              subtitle="Save visual ideas to your storyboard. Click the save button on any image to add it."
              showSaveButtons={true}
              maxItems={50}
            />
          </div>
        )}
      </div>

      {/* Edit Details Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#f7f3ea] border-[#E5DFC6] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="font-display text-[#0a2225]">
              Edit Storyboard Details
            </DialogTitle>
            <DialogDescription className="text-[#8D8D8D] text-[12px]">
              Update the title, description, and tags for this storyboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-[#8D8D8D] mb-1 block">
                Title
              </label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-sm text-[#0a2225] outline-none focus:border-[#0c4d47]"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-[#8D8D8D] mb-1 block">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-sm text-[#0a2225] outline-none resize-none focus:border-[#0c4d47]"
                placeholder="What's this storyboard about? Describe the vibe, destinations, and mood..."
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-[#8D8D8D] mb-1 block">
                Tags (comma separated)
              </label>
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="beach, honeymoon, luxury, Bali"
                className="w-full rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-sm text-[#0a2225] outline-none focus:border-[#0c4d47]"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditPublic(!editPublic)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  editPublic ? "bg-[#0c4d47]" : "bg-[#E5DFC6]"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                    editPublic ? "translate-x-[18px]" : "translate-x-[3px]"
                  }`}
                />
              </button>
              <span className="text-[12px] text-[#4a4a4a]">
                {editPublic ? "Public — visible to everyone" : "Private — only you"}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(false)}
              className="rounded-full text-[11px] border-[#E5DFC6]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={saveDetails}
              disabled={editSaving}
              className="rounded-full text-[11px] bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6]"
            >
              {editSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
