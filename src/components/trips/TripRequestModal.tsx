import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Tag, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BrandProfile {
  profile_id: string;
  name: string;
  avatar_url?: string | null;
  regions?: string[] | null;
  categories?: string[] | null;
}

interface BrandCollection {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
}

interface StoryboardContext {
  tags?: string[];
}

interface TripRequestModalProps {
  open: boolean;
  onClose: () => void;
  brand: BrandProfile;
  collection: BrandCollection;
  storyboardContext?: StoryboardContext;
}

// Helper: Parse "$8k-$12k" or "8000-12000" into integers
function parseBudgetRange(budgetRangeText: string): {
  budgetMin: number | null;
  budgetMax: number | null;
} {
  if (!budgetRangeText) return { budgetMin: null, budgetMax: null };
  
  // Remove $, k, commas and parse
  const cleaned = budgetRangeText.replace(/[$,k]/gi, '');
  const parts = cleaned.split(/[-–to]+/);
  
  const min = parseInt(parts[0]?.trim() || '0', 10) * 
    (budgetRangeText.toLowerCase().includes('k') ? 1000 : 1);
  const max = parseInt(parts[1]?.trim() || '0', 10) * 
    (budgetRangeText.toLowerCase().includes('k') ? 1000 : 1);
  
  return {
    budgetMin: min || null,
    budgetMax: max || null,
  };
}

export function TripRequestModal({
  open,
  onClose,
  brand,
  collection,
  storyboardContext,
}: TripRequestModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [destination, setDestination] = useState(
    brand.regions && brand.regions.length > 0 ? brand.regions[0] : ""
  );
  const [dateRange, setDateRange] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [budgetRange, setBudgetRange] = useState("");
  const [notes, setNotes] = useState(
    `Inspired by the "${collection.title}" collection from ${brand.name}.`
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to submit a trip request.",
        variant: "destructive",
      });
      navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Parse budget range into min/max integers
      const { budgetMin, budgetMax } = parseBudgetRange(budgetRange);

      const payload = {
        user_id: user.id,
        title: `${collection.title} Trip`,
        destination: destination || null,
        start_date: null, // User will refine dates later
        end_date: null,
        travelers_adults: travelers,
        travelers_children: 0,
        budget_min: budgetMin,
        budget_max: budgetMax,
        currency: 'USD',
        description: notes || null,
        special_requests: dateRange ? `Approximate dates: ${dateRange}` : null,
        status: 'open',
        
        // Attribution fields (new columns from migration)
        source_brand_profile_id: brand.profile_id,
        source_collection_id: collection.id,
        source_type: 'brand_collection',
        source_metadata: {
          brand_name: brand.name,
          collection_title: collection.title,
          collection_tags: collection.tags ?? [],
          storyboard_tags: storyboardContext?.tags ?? [],
        },
      };

      const { data, error: insertError } = await supabase
        .from("trip_requests")
        .insert(payload)
        .select("id")
        .single();

      if (insertError) throw insertError;

      const tripRequestId = data.id as string;

      // Log trip_inquiry event
      void supabase.rpc("log_brand_engagement", {
        p_brand_profile_id: brand.profile_id,
        p_event_type: "trip_inquiry",
        p_context_type: "brand_collection",
        p_context_id: collection.id,
        p_metadata: {
          trip_request_id: tripRequestId,
          trip_request_created: true,
          collection_title: collection.title,
        },
      });

      // Trigger AI matching (non-blocking for user)
      void supabase.functions.invoke("ai-trip-matching", {
        body: { tripRequestId },
      });

      toast({
        title: "Trip request submitted",
        description: "We're matching you with creators and agents who fit your vibe.",
      });

      onClose();
      // Optional: navigate to trip requests page
      setTimeout(() => {
        navigate('/trip-requests');
      }, 500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit trip request.");
    } finally {
      setSubmitting(false);
    }
  };

  const combinedTags: string[] = [
    ...(collection.tags ?? []),
    ...(storyboardContext?.tags ?? []),
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl bg-white border-[#E5DFC6] p-0">
        <DialogHeader className="border-b border-[#E5DFC6] px-6 py-4">
          <DialogTitle className="text-sm font-semibold text-[#0a2225]">
            Start a Trip from this Collection
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* LEFT: Context */}
          <aside className="border-r border-[#E5DFC6] bg-[#F5F0E0]/40 px-6 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-[#F5F0E0]">
                {brand.avatar_url ? (
                  <img
                    src={brand.avatar_url}
                    alt={brand.name}
                    className="h-full w-full object-cover"
                  loading="lazy"/>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#0a2225]">
                    {brand.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#7A7151]">
                  Trip with {brand.name}
                </p>
                <p className="text-xs text-[#4a4a4a]">
                  Collection: <span className="font-semibold">{collection.title}</span>
                </p>
              </div>
            </div>

            {collection.cover_image_url && (
              <div className="overflow-hidden rounded-xl bg-[#F5F0E0]">
                <img
                  src={collection.cover_image_url}
                  alt={collection.title}
                  className="h-32 w-full object-cover"
                loading="lazy"/>
              </div>
            )}

            {combinedTags.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A7151]">
                  Vibe & tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {combinedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border border-[#E5DFC6] bg-[#FDFBF5] px-3 py-1 text-[11px] text-[#4a4a4a]"
                    >
                      <Tag className="h-3 w-3 text-[#7A7151]" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {brand.regions && brand.regions.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A7151]">
                  Brand regions
                </p>
                <p className="flex flex-wrap items-center gap-1 text-[11px] text-[#4a4a4a]">
                  <MapPin className="h-3 w-3" />
                  {brand.regions.slice(0, 3).join(" • ")}
                </p>
              </div>
            )}

            <p className="text-[11px] text-[#8C8470]">
              Your request goes to Goldsainte creators/agents who can customize
              this collection to your dates, budget, and travel style.
            </p>
          </aside>

          {/* RIGHT: Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
            {/* Marketplace disclaimer */}
            <Alert className="mb-3 bg-[#f7f3ea] border-[#E5DFC6]">
              <Info className="h-4 w-4 text-[#7A7151]" />
              <AlertDescription className="text-[11px] text-[#4a4a4a]">
                Goldsainte is a curated marketplace connecting travelers with certified travel 
                professionals. Your trip will be fulfilled by the travel agent or creator who 
                accepts your request, not by Goldsainte directly.
              </AlertDescription>
            </Alert>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#7A7151]">
                Destination (optional)
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#BFAD72]" />
                <Input
                  className="pl-7 sm:pl-7 text-sm"
                  placeholder="e.g. Amalfi Coast, Barbados, Iceland"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#7A7151]">
                Approximate dates
              </label>
              <Input
                className="text-sm"
                placeholder="e.g. June 10-17, 2025 (flexible by a few days)"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              />
              <p className="mt-1 text-[10px] text-[#8C8470]">
                We'll work with you to nail down exact dates after you submit
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#7A7151]">
                  Travelers
                </label>
                <Input
                  type="number"
                  min={1}
                  className="text-sm"
                  value={travelers}
                  onChange={(e) =>
                    setTravelers(Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#7A7151]">
                  Budget range (optional)
                </label>
                <Input
                  className="text-sm"
                  placeholder="e.g. $8k-$12k total"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                />
                <p className="mt-1 text-[10px] text-[#8C8470]">
                  Approximate total budget excluding flights
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#7A7151]">
                Trip goals & preferences
              </label>
              <Textarea
                className="text-sm"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tell us about how you like to travel, what you want from this trip, and any non-negotiables."
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-red-700" />
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#0a2225] text-[#E5DFC6] hover:bg-[#0a2225]/90"
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit trip request"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
