import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { ArrowLeft, Globe, Lock, Pencil, CalendarDays, ImageIcon, ArrowRight, ChevronDown, ChevronUp, Send, X, MapPin, Users, DollarSign, Sparkles } from "lucide-react";
import { StoryboardBuilder } from "@/components/storyboards/StoryboardBuilder";
import { TravelStoryboard } from "@/components/storyboards/TravelStoryboard";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  destination: string | null;
  departure_city: string | null;
  start_date: string | null;
  end_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_level: string | null;
  travelers_adults: number | null;
  travelers_children: number | null;
  occasion: string | null;
  accommodation_style: string | null;
  pace: string | null;
  interests: string[] | null;
  flexibility: string | null;
  special_notes: string | null;
  status: string | null;
  trip_length_days: number | null;
  budget_per_person: boolean | null;
  must_haves: string[] | null;
  dealbreakers: string[] | null;
  [key: string]: any;
};

const INTEREST_OPTIONS = [
  "Romantic", "Adventure", "Wellness", "Cultural", "Nightlife",
  "Relaxation", "Luxury", "Family-friendly", "Food-focused", "Beach", "City",
];

const MUST_HAVE_OPTIONS = [
  "5-star hotel", "Boutique hotel", "All-inclusive", "Private transfers",
  "Yacht day", "Guided tours", "Michelin dining", "Spa day",
  "VIP nightlife", "Child-friendly activities",
];

const DEALBREAKER_OPTIONS = [
  "No red-eye flights", "No long layovers", "No hostels",
  "No tourist-heavy areas", "No shared rooms",
];

const PACE_OPTIONS = ["Relaxed", "Moderate", "Active", "Adventure"];
const BUDGET_LEVEL_OPTIONS = ["Budget", "Mid-range", "Luxury", "Ultra-luxury"];
const ACCOMMODATION_OPTIONS = ["Hotel", "Resort", "Villa", "Boutique", "Airbnb", "Hostel"];
const FLEXIBILITY_OPTIONS = ["Exact dates", "± 1-2 days", "± 1 week", "Flexible"];
const OCCASION_OPTIONS = ["Honeymoon", "Anniversary", "Birthday", "Girls Trip", "Guys Trip", "Family Vacation", "Solo Travel", "Babymoon", "Retirement", "Other"];

export default function StoryboardEditorPage() {
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const effectiveMode: "create" | "edit" = params.id ? "edit" : "create";
  const storyboardId = params.id;

  const [initialTitle, setInitialTitle] = useState("");
  const [storyboard, setStoryboard] = useState<StoryboardData | null>(null);
  const [loadingStoryboard, setLoadingStoryboard] = useState(!!storyboardId);
  const [itemCount, setItemCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [storyboardItems, setStoryboardItems] = useState<any[]>([]);
  const [tripDetailsOpen, setTripDetailsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editPublic, setEditPublic] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Trip detail fields (auto-save on blur)
  const [tripFields, setTripFields] = useState({
    destination: "",
    departure_city: "",
    start_date: "",
    end_date: "",
    budget_min: "",
    budget_max: "",
    budget_level: "",
    travelers_adults: "2",
    travelers_children: "0",
    occasion: "",
    accommodation_style: "",
    pace: "",
    interests: [] as string[],
    flexibility: "",
    special_notes: "",
    trip_length_days: "",
    budget_per_person: false,
    must_haves: [] as string[],
    dealbreakers: [] as string[],
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const titleFromQuery = searchParams.get("title");
    if (titleFromQuery) setInitialTitle(titleFromQuery);
  }, [location.search]);

  useEffect(() => {
    if (!storyboardId) { setLoadingStoryboard(false); return; }

    (async () => {
      const [sbResult, countResult, itemsResult] = await Promise.all([
        supabase.from("storyboards").select("*").eq("id", storyboardId).single(),
        supabase.from("storyboard_items").select("id", { count: "exact", head: true }).eq("storyboard_id", storyboardId),
        supabase.from("storyboard_items").select("*").eq("storyboard_id", storyboardId).order("position", { ascending: true }),
      ]);

      if (sbResult.error) { console.error("Error loading storyboard:", sbResult.error); setLoadingStoryboard(false); return; }

      const sb = sbResult.data as StoryboardData;
      setStoryboard(sb);
      setItemCount(countResult.count || 0);
      setStoryboardItems(itemsResult.data || []);

      // Initialize trip fields from DB
      setTripFields({
        destination: sb.destination || "",
        departure_city: sb.departure_city || "",
        start_date: sb.start_date || "",
        end_date: sb.end_date || "",
        budget_min: sb.budget_min?.toString() || "",
        budget_max: sb.budget_max?.toString() || "",
        budget_level: sb.budget_level || "",
        travelers_adults: sb.travelers_adults?.toString() || "2",
        travelers_children: sb.travelers_children?.toString() || "0",
        occasion: sb.occasion || "",
        accommodation_style: sb.accommodation_style || "",
        pace: sb.pace || "",
        interests: sb.interests || [],
        flexibility: sb.flexibility || "",
        special_notes: sb.special_notes || "",
        trip_length_days: sb.trip_length_days?.toString() || "",
        budget_per_person: sb.budget_per_person ?? false,
        must_haves: sb.must_haves || [],
        dealbreakers: sb.dealbreakers || [],
      });

      // Auto-open trip details if any field is filled
      const hasTripData = sb.destination || sb.start_date || sb.budget_min || sb.occasion;
      if (hasTripData) setTripDetailsOpen(true);

      setLoadingStoryboard(false);
    })();
  }, [storyboardId]);

  // Auto-save trip field on blur
  const saveTripField = useCallback(async (field: string, value: any) => {
    if (!storyboardId) return;
    const updateData: Record<string, any> = {};
    if (["budget_min", "budget_max"].includes(field)) {
      updateData[field] = value ? parseFloat(value) : null;
    } else if (["travelers_adults", "travelers_children", "trip_length_days"].includes(field)) {
      updateData[field] = value ? parseInt(value) : null;
    } else if (["interests", "must_haves", "dealbreakers"].includes(field)) {
      updateData[field] = value;
    } else if (field === "budget_per_person") {
      updateData[field] = value;
    } else {
      updateData[field] = value || null;
    }
    await supabase.from("storyboards").update(updateData).eq("id", storyboardId);
  }, [storyboardId]);

  function updateTripField(field: string, value: any) {
    setTripFields(prev => ({ ...prev, [field]: value }));
  }

  function toggleArrayField(field: "interests" | "must_haves" | "dealbreakers", value: string) {
    const current = tripFields[field] as string[];
    const updated = current.includes(value)
      ? current.filter(i => i !== value)
      : [...current, value];
    setTripFields(prev => ({ ...prev, [field]: updated }));
    saveTripField(field, updated);
  }

  // Cover image picker
  async function setCoverImage(imageUrl: string) {
    if (!storyboardId) return;
    await supabase.from("storyboards").update({ cover_image_url: imageUrl }).eq("id", storyboardId);
    setStoryboard(prev => prev ? { ...prev, cover_image_url: imageUrl } : prev);
    setCoverPickerOpen(false);
    toast({ title: "Cover image updated" });
  }

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
    const tags = editTags.split(",").map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from("storyboards").update({
      title: editTitle.trim() || null,
      description: editDescription.trim() || null,
      tags: tags.length > 0 ? tags : null,
      is_public: editPublic,
    }).eq("id", storyboardId);

    if (!error) {
      setStoryboard(prev => prev ? { ...prev, title: editTitle.trim() || null, description: editDescription.trim() || null, tags: tags.length > 0 ? tags : null, is_public: editPublic } : prev);
      setEditOpen(false);
    }
    setEditSaving(false);
  }

  // Submit to marketplace
  async function submitToMarketplace() {
    if (!storyboardId || !storyboard) return;

    // Validate required fields
    if (!tripFields.destination.trim()) {
      toast({ title: "Destination required", description: "Please add a destination in Trip Details before submitting.", variant: "destructive" });
      setTripDetailsOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }

      // Create trip request
      const { data: trip, error: tripError } = await supabase.from("trip_requests").insert({
        user_id: user.id,
        title: storyboard.title || "Trip from storyboard",
        description: storyboard.description || "Trip inspired by my Goldsainte storyboard",
        destination: tripFields.destination || null,
        departure_city: tripFields.departure_city || null,
        start_date: tripFields.start_date || null,
        end_date: tripFields.end_date || null,
        budget_min: tripFields.budget_min ? parseFloat(tripFields.budget_min) : null,
        budget_max: tripFields.budget_max ? parseFloat(tripFields.budget_max) : null,
        budget_level: tripFields.budget_level || null,
        travelers_adults: tripFields.travelers_adults ? parseInt(tripFields.travelers_adults) : 2,
        travelers_children: tripFields.travelers_children ? parseInt(tripFields.travelers_children) : 0,
        occasion: tripFields.occasion || null,
        accommodation_style: tripFields.accommodation_style || null,
        pace: tripFields.pace || null,
        interests: tripFields.interests.length > 0 ? tripFields.interests : null,
        flexibility: tripFields.flexibility || null,
        special_notes: tripFields.special_notes || null,
        status: "open",
        source_metadata: {
          storyboard_id: storyboardId,
          items_count: itemCount,
          trip_length_days: tripFields.trip_length_days ? parseInt(tripFields.trip_length_days) : null,
          budget_per_person: tripFields.budget_per_person,
          must_haves: tripFields.must_haves,
          dealbreakers: tripFields.dealbreakers,
        },
      }).select("id").single();

      if (tripError) throw tripError;

      // Link storyboard to trip request and update status
      await supabase.from("storyboards").update({
        trip_request_id: trip.id,
        status: "submitted",
      }).eq("id", storyboardId);

      toast({ title: "Submitted to marketplace!", description: "Travel agents can now view and bid on your trip request." });
      navigate("/my-trip-requests");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Submission failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  function handleStoryboardSaved(id: string) {
    navigate("/storyboards");
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  const isSubmitted = storyboard?.status === "submitted";

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/storyboards" className="mb-6 inline-flex items-center gap-2 text-[11px] text-[#4a4a4a] hover:text-[#0a2225]">
          <ArrowLeft className="h-3 w-3" /> Back to storyboards
        </Link>

        {/* Concierge origin banner */}
        {storyboard?.related_concierge_session_id && !loadingStoryboard && (
          <div className="mb-4 rounded-2xl border border-[#E5DFC6] bg-white/90 px-3 py-2 text-[11px] flex flex-wrap items-center justify-between gap-2">
            <div className="text-[#4a4a4a]">
              <span className="font-semibold text-[#0a2225]">Created from your conversation with Madison</span>
              <span className="text-[#8D8D8D]"> · {formatDate(storyboard.created_at)}</span>
            </div>
            <Link to={`/concierge?sessionId=${storyboard.related_concierge_session_id}`} className="text-[10px] font-semibold text-[#0c4d47] underline underline-offset-2 hover:text-[#073331]">
              View that concierge thread
            </Link>
          </div>
        )}

        {/* ── Detail Hero Section (edit mode only) ── */}
        {effectiveMode === "edit" && storyboard && !loadingStoryboard && (
          <div className="mb-6 rounded-[32px] border border-[#E5DFC6] bg-white/95 overflow-hidden">
            {/* Cover image */}
            <div className="relative cursor-pointer group" onClick={() => setCoverPickerOpen(true)}>
              {storyboard.cover_image_url ? (
                <div className="relative aspect-[21/9] w-full">
                  <img src={storyboard.cover_image_url} alt={storyboard.title || "Storyboard cover"} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/20">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium">Change cover</span>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[21/9] w-full bg-gradient-to-br from-[#e8e0cc] to-[#d4cbb3] flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 text-[#b5a88a] mx-auto mb-1" />
                    <span className="text-[11px] text-[#8D8D8D]">Click to set cover image</span>
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="px-5 py-5 md:px-6">
              <div className="flex items-start justify-between gap-3">
                <h1 className="font-display text-2xl md:text-[28px] text-[#0a2225] leading-tight">
                  {storyboard.title || "Untitled Storyboard"}
                </h1>
                {isSubmitted && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] shrink-0">
                    Submitted
                  </Badge>
                )}
              </div>

              {storyboard.description && (
                <p className="mt-2 text-[13px] leading-relaxed text-[#4a4a4a]">{storyboard.description}</p>
              )}

              {storyboard.tags && storyboard.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {storyboard.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="rounded-full bg-[#f7f3ea] text-[#4a4a4a] border border-[#E5DFC6] text-[10px] px-2.5 py-0.5 font-medium">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Trip summary pills */}
              {(storyboard.destination || storyboard.occasion || storyboard.budget_max || (storyboard.must_haves && storyboard.must_haves.length > 0) || (storyboard.dealbreakers && storyboard.dealbreakers.length > 0)) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {storyboard.destination && (
                    <Badge variant="outline" className="rounded-full text-[10px] border-[#0c4d47]/30 text-[#0c4d47]">
                      <MapPin className="h-2.5 w-2.5 mr-1" /> {storyboard.destination}
                    </Badge>
                  )}
                  {storyboard.occasion && (
                    <Badge variant="outline" className="rounded-full text-[10px] border-[#0c4d47]/30 text-[#0c4d47]">
                      <Sparkles className="h-2.5 w-2.5 mr-1" /> {storyboard.occasion}
                    </Badge>
                  )}
                  {storyboard.budget_max && (
                    <Badge variant="outline" className="rounded-full text-[10px] border-[#0c4d47]/30 text-[#0c4d47]">
                      <DollarSign className="h-2.5 w-2.5 mr-1" /> Up to ${Number(storyboard.budget_max).toLocaleString()}{storyboard.budget_per_person ? " /person" : ""}
                    </Badge>
                  )}
                  {(storyboard.travelers_adults && storyboard.travelers_adults > 0) && (
                    <Badge variant="outline" className="rounded-full text-[10px] border-[#0c4d47]/30 text-[#0c4d47]">
                      <Users className="h-2.5 w-2.5 mr-1" /> {storyboard.travelers_adults} adult{storyboard.travelers_adults !== 1 ? "s" : ""}
                      {storyboard.travelers_children ? `, ${storyboard.travelers_children} child${storyboard.travelers_children !== 1 ? "ren" : ""}` : ""}
                    </Badge>
                  )}
                  {storyboard.trip_length_days && (
                    <Badge variant="outline" className="rounded-full text-[10px] border-[#0c4d47]/30 text-[#0c4d47]">
                      <CalendarDays className="h-2.5 w-2.5 mr-1" /> {storyboard.trip_length_days} days
                    </Badge>
                  )}
                  {storyboard.must_haves && storyboard.must_haves.length > 0 && (
                    <Badge variant="outline" className="rounded-full text-[10px] border-emerald-400/50 text-emerald-700">
                      ✓ {storyboard.must_haves.length} must-have{storyboard.must_haves.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {storyboard.dealbreakers && storyboard.dealbreakers.length > 0 && (
                    <Badge variant="outline" className="rounded-full text-[10px] border-red-300/50 text-red-600">
                      ✗ {storyboard.dealbreakers.length} dealbreaker{storyboard.dealbreakers.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              )}

              {/* Meta row */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-[#8D8D8D]">
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Created {formatDate(storyboard.created_at)}</span>
                {storyboard.updated_at !== storyboard.created_at && <span>· Updated {formatDate(storyboard.updated_at)}</span>}
                <span>· {itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                <span className="inline-flex items-center gap-1">
                  {storyboard.is_public ? <><Globe className="h-3 w-3" /> Public</> : <><Lock className="h-3 w-3" /> Private</>}
                </span>
                {storyboard.role && <Badge variant="outline" className="text-[10px] capitalize border-[#E5DFC6]">{storyboard.role}</Badge>}
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={openEditDialog} className="rounded-full text-[11px] border-[#E5DFC6] text-[#0a2225] hover:bg-[#f7f3ea]">
                  <Pencil className="h-3 w-3 mr-1" /> Edit Details
                </Button>
                {!isSubmitted && (
                  <>
                    <Button variant="default" size="sm" onClick={submitToMarketplace} disabled={submitting} className="rounded-full text-[11px] bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6]">
                      <Send className="h-3 w-3 mr-1" /> {submitting ? "Submitting…" : "Submit to Marketplace"}
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="rounded-full text-[11px] text-[#8D8D8D] hover:text-[#0a2225]">
                      <Link to={`/post-trip?fromStoryboard=${storyboardId}`}>
                        Use Trip Wizard <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </>
                )}
                {isSubmitted && storyboard.trip_request_id && (
                  <Button variant="default" size="sm" asChild className="rounded-full text-[11px] bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6]">
                    <Link to="/my-trip-requests">View Trip Request <ArrowRight className="h-3 w-3 ml-1" /></Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Trip Details Collapsible (edit mode) ── */}
        {effectiveMode === "edit" && storyboard && !loadingStoryboard && !isSubmitted && (
          <Collapsible open={tripDetailsOpen} onOpenChange={setTripDetailsOpen} className="mb-6">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between rounded-2xl border border-[#E5DFC6] bg-white/95 px-5 py-3 text-left hover:bg-[#f7f3ea]/50 transition">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#0c4d47]" />
                  <span className="text-sm font-semibold text-[#0a2225]">Trip Details</span>
                  <span className="text-[11px] text-[#8D8D8D]">— fill in to submit to marketplace</span>
                </div>
                {tripDetailsOpen ? <ChevronUp className="h-4 w-4 text-[#8D8D8D]" /> : <ChevronDown className="h-4 w-4 text-[#8D8D8D]" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 rounded-2xl border border-[#E5DFC6] bg-white/95 p-5 space-y-5">
                {/* Row 1: Destination + Departure */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldBlock label="Destination *">
                    <input value={tripFields.destination} onChange={e => updateTripField("destination", e.target.value)} onBlur={() => saveTripField("destination", tripFields.destination)} placeholder="e.g. Bali, Italy, Maldives" className="field-input" />
                  </FieldBlock>
                  <FieldBlock label="Departure City">
                    <input value={tripFields.departure_city} onChange={e => updateTripField("departure_city", e.target.value)} onBlur={() => saveTripField("departure_city", tripFields.departure_city)} placeholder="e.g. New York, London" className="field-input" />
                  </FieldBlock>
                </div>

                {/* Row 2: Dates + Trip Length */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FieldBlock label="Start Date">
                    <input type="date" value={tripFields.start_date} onChange={e => { updateTripField("start_date", e.target.value); saveTripField("start_date", e.target.value); }} className="field-input" />
                  </FieldBlock>
                  <FieldBlock label="End Date">
                    <input type="date" value={tripFields.end_date} onChange={e => { updateTripField("end_date", e.target.value); saveTripField("end_date", e.target.value); }} className="field-input" />
                  </FieldBlock>
                  <FieldBlock label="Trip Length (days)" className="col-span-2 md:col-span-1">
                    <input type="number" min="1" max="90" value={tripFields.trip_length_days} onChange={e => updateTripField("trip_length_days", e.target.value)} onBlur={() => saveTripField("trip_length_days", tripFields.trip_length_days)} placeholder="e.g. 7" className="field-input" />
                  </FieldBlock>
                </div>

                {/* Row 3: Travelers + Occasion */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FieldBlock label="Adults">
                    <input type="number" min="1" max="20" value={tripFields.travelers_adults} onChange={e => updateTripField("travelers_adults", e.target.value)} onBlur={() => saveTripField("travelers_adults", tripFields.travelers_adults)} className="field-input" />
                  </FieldBlock>
                  <FieldBlock label="Children">
                    <input type="number" min="0" max="20" value={tripFields.travelers_children} onChange={e => updateTripField("travelers_children", e.target.value)} onBlur={() => saveTripField("travelers_children", tripFields.travelers_children)} className="field-input" />
                  </FieldBlock>
                  <FieldBlock label="Occasion" className="col-span-2 md:col-span-1">
                    <select value={tripFields.occasion} onChange={e => { updateTripField("occasion", e.target.value); saveTripField("occasion", e.target.value); }} className="field-input">
                      <option value="">Select...</option>
                      {OCCASION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </FieldBlock>
                </div>

                {/* Row 4: Budget */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FieldBlock label="Budget Min ($)">
                    <input type="number" min="0" value={tripFields.budget_min} onChange={e => updateTripField("budget_min", e.target.value)} onBlur={() => saveTripField("budget_min", tripFields.budget_min)} placeholder="1000" className="field-input" />
                  </FieldBlock>
                  <FieldBlock label="Budget Max ($)">
                    <input type="number" min="0" value={tripFields.budget_max} onChange={e => updateTripField("budget_max", e.target.value)} onBlur={() => saveTripField("budget_max", tripFields.budget_max)} placeholder="5000" className="field-input" />
                  </FieldBlock>
                  <FieldBlock label="Budget Level" className="col-span-2 md:col-span-1">
                    <select value={tripFields.budget_level} onChange={e => { updateTripField("budget_level", e.target.value); saveTripField("budget_level", e.target.value); }} className="field-input">
                      <option value="">Select...</option>
                      {BUDGET_LEVEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </FieldBlock>
                </div>

                {/* Budget per-person toggle */}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => { const v = !tripFields.budget_per_person; updateTripField("budget_per_person", v); saveTripField("budget_per_person", v); }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${tripFields.budget_per_person ? "bg-[#0c4d47]" : "bg-[#E5DFC6]"}`}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${tripFields.budget_per_person ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
                  </button>
                  <span className="text-[12px] text-[#4a4a4a]">{tripFields.budget_per_person ? "Budget is per person" : "Budget is for the total trip"}</span>
                </div>

                {/* Row 5: Accommodation + Pace + Flexibility */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FieldBlock label="Accommodation Style">
                    <select value={tripFields.accommodation_style} onChange={e => { updateTripField("accommodation_style", e.target.value); saveTripField("accommodation_style", e.target.value); }} className="field-input">
                      <option value="">Select...</option>
                      {ACCOMMODATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </FieldBlock>
                  <FieldBlock label="Pace">
                    <select value={tripFields.pace} onChange={e => { updateTripField("pace", e.target.value); saveTripField("pace", e.target.value); }} className="field-input">
                      <option value="">Select...</option>
                      {PACE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </FieldBlock>
                  <FieldBlock label="Date Flexibility">
                    <select value={tripFields.flexibility} onChange={e => { updateTripField("flexibility", e.target.value); saveTripField("flexibility", e.target.value); }} className="field-input">
                      <option value="">Select...</option>
                      {FLEXIBILITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </FieldBlock>
                </div>

                {/* Vibe & Experience Tags */}
                <FieldBlock label="Vibe & Experience Tags">
                  <div className="flex flex-wrap gap-1.5">
                    {INTEREST_OPTIONS.map(interest => (
                      <button key={interest} type="button" onClick={() => toggleArrayField("interests", interest)}
                        className={`rounded-full px-3 py-1 text-[11px] border transition ${
                          tripFields.interests.includes(interest)
                            ? "bg-[#0c4d47] text-[#E5DFC6] border-[#0c4d47]"
                            : "bg-white text-[#4a4a4a] border-[#E5DFC6] hover:border-[#0c4d47]"
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </FieldBlock>

                {/* Must-Haves */}
                <FieldBlock label="Must-Haves">
                  <div className="flex flex-wrap gap-1.5">
                    {MUST_HAVE_OPTIONS.map(item => (
                      <button key={item} type="button" onClick={() => toggleArrayField("must_haves", item)}
                        className={`rounded-full px-3 py-1 text-[11px] border transition ${
                          tripFields.must_haves.includes(item)
                            ? "bg-emerald-700 text-white border-emerald-700"
                            : "bg-white text-[#4a4a4a] border-[#E5DFC6] hover:border-emerald-600"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </FieldBlock>

                {/* Dealbreakers */}
                <FieldBlock label="Dealbreakers">
                  <div className="flex flex-wrap gap-1.5">
                    {DEALBREAKER_OPTIONS.map(item => (
                      <button key={item} type="button" onClick={() => toggleArrayField("dealbreakers", item)}
                        className={`rounded-full px-3 py-1 text-[11px] border transition ${
                          tripFields.dealbreakers.includes(item)
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-[#4a4a4a] border-[#E5DFC6] hover:border-red-400"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </FieldBlock>

                {/* Special Notes */}
                <FieldBlock label="Special Notes">
                  <textarea value={tripFields.special_notes} onChange={e => updateTripField("special_notes", e.target.value)} onBlur={() => saveTripField("special_notes", tripFields.special_notes)} rows={3} placeholder="Anything else your travel agent should know..." className="field-input resize-none" />
                </FieldBlock>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Create mode heading */}
        {effectiveMode === "create" && (
          <div className="mb-6">
            <h1 className="font-display text-[28px] text-[#0a2225]">Create Storyboard</h1>
            <p className="mt-2 text-[13px] text-[#4a4a4a]">Build a visual storyboard with photos, experiences, and links to inspire your trips and packages.</p>
          </div>
        )}

        <StoryboardBuilder storyboardId={storyboardId} initialTitle={storyboard?.title || initialTitle} mode="creator" onSaved={handleStoryboardSaved} />

        {effectiveMode === "create" && (
          <div className="mt-10 pt-8 border-t border-[#E5DFC6]">
            <TravelStoryboard title="Browse Inspiration" subtitle="Save visual ideas to your storyboard. Click the save button on any image to add it." showSaveButtons={true} maxItems={50} />
          </div>
        )}
      </div>

      {/* Edit Details Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#f7f3ea] border-[#E5DFC6] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="font-display text-[#0a2225]">Edit Storyboard Details</DialogTitle>
            <DialogDescription className="text-[#8D8D8D] text-[12px]">Update the title, description, and tags.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-[#8D8D8D] mb-1 block">Title</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-sm text-[#0a2225] outline-none focus:border-[#0c4d47]" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-[#8D8D8D] mb-1 block">Description</label>
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} className="w-full rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-sm text-[#0a2225] outline-none resize-none focus:border-[#0c4d47]" placeholder="What's this storyboard about?" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-[#8D8D8D] mb-1 block">Tags (comma separated)</label>
              <input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="beach, honeymoon, luxury" className="w-full rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-sm text-[#0a2225] outline-none focus:border-[#0c4d47]" />
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setEditPublic(!editPublic)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${editPublic ? "bg-[#0c4d47]" : "bg-[#E5DFC6]"}`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${editPublic ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
              </button>
              <span className="text-[12px] text-[#4a4a4a]">{editPublic ? "Public — visible to everyone" : "Private — only you"}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)} className="rounded-full text-[11px] border-[#E5DFC6]">Cancel</Button>
            <Button size="sm" onClick={saveDetails} disabled={editSaving} className="rounded-full text-[11px] bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6]">{editSaving ? "Saving…" : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cover Image Picker Dialog */}
      <Dialog open={coverPickerOpen} onOpenChange={setCoverPickerOpen}>
        <DialogContent className="bg-[#f7f3ea] border-[#E5DFC6] rounded-[24px] max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-[#0a2225]">Set Cover Image</DialogTitle>
            <DialogDescription className="text-[#8D8D8D] text-[12px]">Click a photo from your storyboard to use as the cover.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 mt-2 max-h-[400px] overflow-y-auto">
            {storyboardItems.filter((item: any) => item.image_url).map((item: any) => (
              <button key={item.id} type="button" onClick={() => setCoverImage(item.image_url)} className="relative overflow-hidden rounded-xl group aspect-square">
                <img src={item.image_url} alt={item.title || "Photo"} className="h-full w-full object-cover group-hover:opacity-80 transition" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30">
                  <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium">Use as cover</span>
                </div>
              </button>
            ))}
            {storyboardItems.filter((item: any) => item.image_url).length === 0 && (
              <p className="col-span-3 text-center text-[12px] text-[#8D8D8D] py-8">No photos in this storyboard yet. Add some photos first!</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .field-input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #E5DFC6;
          background: white;
          padding: 8px 12px;
          font-size: 13px;
          color: #0a2225;
          outline: none;
          transition: border-color 0.15s;
        }
        .field-input:focus {
          border-color: #0c4d47;
        }
        .field-input::placeholder {
          color: #8D8D8D;
        }
      `}</style>
    </main>
  );
}

function FieldBlock({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-[11px] uppercase tracking-[0.14em] text-[#8D8D8D] mb-1 block">{label}</label>
      {children}
    </div>
  );
}
