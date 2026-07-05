import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BackButton } from "@/components/ui/BackButton";
import { TripImageUploader } from "@/components/trips/TripImageUploader";
import { ArrayFieldEditor } from "@/components/trips/ArrayFieldEditor";
import { Loader2, Plus, X, Save, Send, BookOpen, Eye } from "lucide-react";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/confirm-dialog";

const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CAD"];

type Day = {
  day_number: number;
  title: string;
  description: string;
  activities: string[];
  accommodation: string;
};

const labelClasses = "text-sm font-medium text-[#0a2225]";
const inputClasses = "rounded-xl h-11 sm:h-12 text-sm sm:text-base border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20 focus:border-[#C7A962]";
const textareaClasses = "rounded-xl border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20 focus:border-[#C7A962]";
const helperClasses = "text-xs text-[#9A9384] mt-1";


/* ── Guide templates ──────────────────────────────────────────
   Seven proven structures. Each day carries prompt-style copy the
   creator overwrites — teaching the specific, honestly-priced
   style that sells (the "Marrakech, Properly" standard). */
type GuideTemplate = {
  id: string;
  name: string;
  tagline: string;
  durationLabel: string;
  days: Day[];
};

const tday = (n: number, title: string, description: string, activities: string[], accommodation = ""): Day =>
  ({ day_number: n, title, description, activities, accommodation });

const GUIDE_TEMPLATES: GuideTemplate[] = [
  {
    id: "city-immersion", name: "City Immersion",
    tagline: "The five-day deep cut — arrival ritual to day-trip finale.",
    durationLabel: "5 days",
    days: [
      tday(1, "Arrive & Meet the City", "Set the arrival ritual: where travelers land, the first honest thing to do, and the landmark that becomes their compass for the week.", ["Check-in ritual — what locals would tell a friend to do first", "A gentle first walk to the city's orienting landmark", "The classic first-night experience — the honest way to do it, and what it costs"], "Name the neighborhood to stay in — and why"),
      tday(2, "The Masterpieces", "The two or three sights that justify the trip — with the exact timing that beats the crowds, and where lunch saves the afternoon.", ["The headline sight, at the hour it's actually quiet", "The smaller museum or courtyard most visitors miss", "Lunch worth planning around — name it, price it", "The dinner reservation worth booking before the flight"]),
      tday(3, "Neighborhoods & Rituals", "Go where the city actually lives: a market quarter, a local ritual (bathhouse, tea house, match), food without tablecloths.", ["The neighborhood walk, with one loose mission", "The local ritual — with the etiquette a first-timer needs", "The honest local lunch — name the dish, name the place"]),
      tday(4, "Art, Style & the Splurge", "The design-and-gallery day, ending in the one dinner that should be theater. Say what to order and what it really costs.", ["The garden, gallery or museum that needs pre-booked tickets", "The stylish lunch locals are proud of", "The splurge dinner — reservation essential; set price expectations"]),
      tday(5, "The Finale", "The day-trip that changes the trip's scale — mountains, coast or desert — with real transport logistics and honest pricing.", ["The excursion: booked how far ahead, at what price range", "The sunset moment the whole trip builds to", "The smooth exit: transfer timing and cost to the airport"], "Optional overnight — name the kind of place"),
    ],
  },
  {
    id: "weekend-escape", name: "Weekend Escape",
    tagline: "48 golden hours — zero wasted minutes.",
    durationLabel: "3 days",
    days: [
      tday(1, "Friday: Land & Dive In", "No easing in — a weekend has no warm-up lap. Bags down, straight to the evening that sets the tone.", ["The drop-bags-and-go first stop", "Dinner at the place that defines the city, booked ahead", "One nightcap spot with a view or a story"]),
      tday(2, "Saturday: The Full Day", "The one complete day — morning icon, market lunch, afternoon neighborhood, evening event. Tight, timed, generous.", ["The icon at opening hour", "Market or street-food lunch — name three things to eat", "The afternoon quarter to wander", "The Saturday-night thing locals actually do"]),
      tday(3, "Sunday: Slow, Then Home", "The unhurried morning that makes the weekend feel longer than it was — then the graceful exit.", ["The long-breakfast institution", "One last unmissable thing on the route out", "Exit logistics: when to leave, how, and what it costs"]),
    ],
  },
  {
    id: "food-pilgrimage", name: "Food Pilgrimage",
    tagline: "Eat the city, in the right order.",
    durationLabel: "4 days",
    days: [
      tday(1, "Arrival Appetite", "First meals set the standard: start with the dish the city is known for, made by the place that made it famous.", ["The definitive version of the signature dish", "The bakery or café for the morning after", "The night market or late-eats street to scout"]),
      tday(2, "Market Morning to Old Guard", "Markets before ten, then the decades-old institutions where the recipes never changed. Name dishes, name prices.", ["The central market — three stalls worth the queue", "Lunch at the old-guard institution (what to order)", "The afternoon coffee, tea or dessert ritual", "Dinner: the chef's counter or family-run room worth booking"]),
      tday(3, "Street Level", "The street-food crawl, mapped: 4–6 stops, one dish each, with honest hygiene advice.", ["The stop-by-stop crawl route — one dish per stop, with prices", "The city's drink-pairing tradition", "A walk that earns dinner"]),
      tday(4, "Hands In, Splurge Out", "Cook it yourself in the morning; let the city's best kitchen cook for you at night.", ["The cooking class or market-to-table experience (book ahead)", "The one tasting-menu splurge — set the price expectation", "Edible souvenirs that survive a suitcase — and where to buy them"]),
    ],
  },
  {
    id: "adventure-week", name: "Adventure Week",
    tagline: "Seven days, honest difficulty, real logistics.",
    durationLabel: "7 days",
    days: [
      tday(1, "Basecamp", "Arrive, gear-check, meet guides. State fitness expectations plainly — the kindest thing an adventure guide can do.", ["Arrival + gear rental or check (costs; bring vs rent)", "Operator briefing — name the reputable operators", "Early night; hydration and altitude/heat notes"]),
      tday(2, "Acclimatize", "The warm-up day that prevents the mid-week collapse: shorter distance, full beauty.", ["The half-day route with the best effort-to-view ratio", "Afternoon recovery ritual", "Fuel: the calorie-dense local dinner"]),
      tday(3, "Big Day One", "The first full push. Distances, elevation, water points, turnaround times — precision is the luxury here.", ["The route, with honest numbers", "The lunch stop or packed-lunch plan", "Evening: stretch, refuel, sleep"]),
      tday(4, "Big Day Two", "The signature day — the one on the postcards. What it takes and what it gives.", ["The marquee route or activity", "The summit/reef/canyon moment and its timing", "The celebration dinner that's earned"]),
      tday(5, "Rest & Culture", "Legs down, eyes open: the village, town or culture day that gives the week its texture.", ["The local experience that isn't physical", "The craft, food or history stop", "An optional gentle add-on for the restless"]),
      tday(6, "Choose Your Finale", "Two endings — the harder variant and the beautiful one — so every fitness level finishes proud.", ["Option A: the challenge finale", "Option B: the scenic finale", "The sunrise or sunset plan"]),
      tday(7, "Descend & Depart", "The logistics day done gracefully: transfers, timings, and the last meal worth planning.", ["Transfer plan with real timings and costs", "The farewell meal", "Gear return; tipping guidance for guides and porters"], "Final-night option if flights are morning-after"),
    ],
  },
  {
    id: "romance", name: "Romance & Honeymoon",
    tagline: "Six days that feel like a held breath.",
    durationLabel: "6 days",
    days: [
      tday(1, "Arrive Softly", "No agenda on night one — just the room, the view, and one perfect table.", ["The arrival amenity or ritual worth arranging ahead", "Dinner: intimate over impressive — name it"], "The room category worth the upgrade — say why"),
      tday(2, "The City à Deux", "The sights, at couple's pace — long lunches allowed, museums optional.", ["One icon, one hidden courtyard", "The long lunch with a view", "The golden-hour walk route"]),
      tday(3, "Water, Spa or Stillness", "The slow day: pool, hammam, onsen or beach — whatever the destination does best.", ["The spa/beach/bath experience (book ahead; price honestly)", "The do-nothing afternoon, protected", "Casual dinner where dressing up is optional"]),
      tday(4, "The Adventure Shared", "One active memory — the sail, the ride, the climb small enough for two.", ["The shared activity, with a great operator", "The picnic or hidden lunch spot", "Sunset positioning — exactly where, exactly when"]),
      tday(5, "The Splurge Night", "The night the trip is remembered by. Reserve early, dress up, no phones.", ["The once-in-a-trip dinner — set the price expectation", "The after: rooftop, music, or a night walk"]),
      tday(6, "Slow Goodbye", "A last unhurried morning designed to end on a high, not a scramble.", ["The farewell-breakfast institution", "One keepsake worth buying — and where", "Graceful exit logistics"]),
    ],
  },
  {
    id: "family", name: "Family Adventure",
    tagline: "Five days that work for ages 6 to 60.",
    durationLabel: "5 days",
    days: [
      tday(1, "Land & Settle", "Arrival with kids is a logistics sport — solve the first evening before it happens.", ["The kid-proof first dinner near the hotel", "The early-evening park, plaza or promenade", "The night-one supplies run"], "Family room / apartment guidance — what actually matters"),
      tday(2, "The Wow Day", "Lead with the thing kids will talk about for a year — and the adult reward nearby.", ["The headline family attraction, with skip-the-line advice", "Lunch that pleases both generations", "The nearby grown-up pleasure while kids are content"]),
      tday(3, "Hands-On Day", "Kids remember what they touched: the workshop, the farm, the boat, the beach.", ["The interactive experience worth booking", "The easiest good lunch of the trip", "The afternoon energy-burner, with parents' coffee in sight"]),
      tday(4, "Split & Reunite", "One morning where the family divides by interest — then the shared afternoon classic.", ["Option A (younger) / Option B (older) morning tracks", "The reunion lunch", "The all-ages afternoon icon"]),
      tday(5, "The Big Finish", "End on the trip's exclamation mark, then pack without tears.", ["The finale experience — save the best for last", "The farewell treat (name the exact ice cream, pastry or stall)", "Exit logistics that keep everyone sane"]),
    ],
  },
  {
    id: "blank", name: "Blank Canvas",
    tagline: "Your structure, from an empty page.",
    durationLabel: "You decide",
    days: [tday(1, "", "", [])],
  },
];

export default function ItineraryBuilderPage() {
  const { user } = useAuth();
  const { hasCreatorAccess } = useUserRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  // New guides start at the template picker; edits go straight to the editor.
  const [phase, setPhase] = useState<"templates" | "editor">(editId ? "editor" : "templates");
  const [form, setForm] = useState({
    title: "",
    destination: "",
    duration_days: "5",
    price: "",
    currency: "USD",
    cover_image_url: "",
    description: "",
  });
  const [days, setDays] = useState<Day[]>([
    { day_number: 1, title: "", description: "", activities: [], accommodation: "" },
  ]);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data, error } = await supabase
        .from("itinerary_products")
        .select("*")
        .eq("id", editId)
        .maybeSingle();
      if (error || !data) {
        toast.error("Could not load guide");
        setLoading(false);
        return;
      }
      setForm({
        title: data.title ?? "",
        destination: data.destination ?? "",
        duration_days: String(data.duration_days ?? 5),
        price: String(data.price ?? ""),
        currency: data.currency ?? "USD",
        cover_image_url: data.cover_image_url ?? "",
        description: data.description ?? "",
      });
      const loaded = Array.isArray(data.days) ? (data.days as any as Day[]) : [];
      if (loaded.length) setDays(loaded);
      setLoading(false);
    })();
  }, [editId]);

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const setDuration = (val: string) => {
    update("duration_days", val);
    const n = Math.max(1, Math.min(60, parseInt(val) || 1));
    setDays((prev) => {
      const next = [...prev];
      while (next.length < n) {
        next.push({ day_number: next.length + 1, title: "", description: "", activities: [], accommodation: "" });
      }
      return next.slice(0, n).map((d, i) => ({ ...d, day_number: i + 1 }));
    });
  };

  const applyTemplate = (t: GuideTemplate) => {
    setDays(t.days.map((d) => ({ ...d, activities: [...d.activities] })));
    update("duration_days", String(t.days.length));
    setPhase("editor");
  };

  const patchDay = (idx: number, patch: Partial<Day>) =>
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));

  const handleSave = async (status: "draft" | "published") => {
    if (!user) return;
    if (status === "published") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_charges_enabled")
        .eq("id", user.id)
        .maybeSingle();
      if (!(profile as any)?.stripe_charges_enabled) {
        // Agents can't enter /creator-dashboard (it redirects non-creators to
        // /traveler) — their payout card lives on the agent Guides tab.
        const setupPath = hasCreatorAccess
          ? "/creator-dashboard?tab=earnings"
          : "/agent-dashboard?tab=guides";
        const setupWhere = hasCreatorAccess ? "in Earnings" : "on your Guides tab";
        const goSetup = await confirmDialog({
          title: "Stripe payout verification required",
          description:
            `Goldsainte reviews every guide before it goes live, and we can only approve (and pay out) guides from accounts with verified Stripe payouts. Finish payout verification ${setupWhere}, then publish — your draft is safe in the meantime.`,
          confirmText: "Open payout setup",
          cancelText: "Keep editing",
        });
        if (goSetup) navigate(setupPath);
        return;
      }

      // Make the review step explicit before anything is submitted.
      const proceed = await confirmDialog({
        title: "Submit for Goldsainte review?",
        description:
          "Publishing sends this guide to the Goldsainte team for approval. It goes live to travelers once approved — typically within 24 hours — and you'll be notified.",
        confirmText: "Submit for review",
        cancelText: "Keep editing",
      });
      if (!proceed) return;
    }
    if (!form.title.trim() || !form.destination.trim() || !form.price) {
      toast.error("Title, destination and price are required.");
      return;
    }
    try {
      setSaving(true);
      const persistedStatus = status === "published" ? "pending_review" : "draft";
      const payload = {
        creator_id: user.id,
        title: form.title.trim(),
        destination: form.destination.trim(),
        duration_days: parseInt(form.duration_days) || 1,
        price: parseFloat(form.price),
        currency: form.currency,
        cover_image_url: form.cover_image_url || null,
        description: form.description || null,
        days: days as any,
        status: persistedStatus,
      };
      let savedId: string | null = editId;
      if (editId) {
        const { error } = await supabase
          .from("itinerary_products")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from("itinerary_products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        savedId = inserted?.id ?? null;
      }
      if (status === "published") {
        // In-app admin notifications + email ping to the review inbox
        // (best-effort — a notification hiccup never blocks submission).
        const savedGuideId = savedId;
        if (savedGuideId) {
          (supabase as any)
            .rpc("notify_admins_guide_pending_review", {
              _guide_id: savedGuideId,
              _guide_title: form.title || "Untitled guide",
            })
            .then(({ error }: any) => {
              if (error) console.error("Admin notification failed:", error);
            });
        }
        toast.success(
          "Your guide has been submitted for review. We typically review within 24 hours and will notify you when it's live."
        );
      } else {
        toast.success("Draft saved");
      }
      navigate("/creator-dashboard");
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Phase 1: template picker (new guides only) ─────────────── */
  if (phase === "templates" && !loading) {
    return (
      <div className="min-h-screen bg-[#FDF9F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-16">
          <div className="mb-6">
            <BackButton to="/creator-dashboard" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#C7A962] font-medium">New Guide</p>
          <h1 className="font-secondary text-3xl text-[#0a2225] mt-2">Choose your starting point</h1>
          <p className="text-sm text-[#6B7280] mt-2 max-w-2xl leading-relaxed">
            Each template scaffolds a proven guide structure with prompts that teach what sells:
            real places, honest prices, exact timing. Every day is editable — and the price is
            entirely yours to set.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {GUIDE_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                className="text-left rounded-2xl border border-[#E5DFC6] bg-white p-5 hover:border-[#C7A962] hover:shadow-sm transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-secondary text-lg text-[#0a2225] group-hover:text-[#0c4d47]">{t.name}</span>
                  <span className="text-[11px] uppercase tracking-wider text-[#9CA3AF]">{t.durationLabel}</span>
                </div>
                <p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">{t.tagline}</p>
                <ul className="mt-3 space-y-1">
                  {t.days.slice(0, 3).map((d, i) => (
                    <li key={i} className="text-xs text-[#0a2225]/60 truncate">
                      <span className="text-[#C7A962]">•</span> {d.title || "Day 1"}
                    </li>
                  ))}
                  {t.days.length > 3 && (
                    <li className="text-xs text-[#9CA3AF]">+ {t.days.length - 3} more days</li>
                  )}
                </ul>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-16">
        <div className="mb-4 flex items-center justify-between">
          <BackButton to="/creator-dashboard" />
          {!editId && (
            <button
              type="button"
              onClick={() => setPhase("templates")}
              className="text-xs uppercase tracking-wider text-[#C7A962] hover:text-[#8a7136]"
            >
              Change template
            </button>
          )}
        </div>

        <div className="mb-6 rounded-2xl border border-[#C7A962]/40 bg-[#C7A962]/10 px-4 py-3 text-sm text-[#0a2225] leading-relaxed">
          <span className="font-medium">How publishing works:</span> guides are reviewed by
          Goldsainte before going live — typically within 24 hours — and Stripe payout
          verification must be complete before a guide can be approved. Drafts save anytime.
        </div>
        <div className="w-16 h-0.5 bg-[#C7A962] mb-6" />
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-[#E5DFC6] mb-4">
          <BookOpen className="h-4 w-4 text-[#C7A962]" />
          <span className="text-sm font-medium text-[#6B7280] tracking-wide">Itinerary Guide</span>
        </div>
        <h1 className="font-secondary text-2xl sm:text-3xl md:text-4xl text-[#0a2225] tracking-tight">
          {editId ? <>Edit <em>Guide</em></> : <>Sell an <em>Itinerary Guide</em></>}
        </h1>
        <p className="mt-3 text-[#6B7280] text-base max-w-xl leading-relaxed">
          Package your travel knowledge as a digital product travelers can buy and download instantly.
        </p>

        <div className="mt-12 space-y-12">
          {/* Basics */}
          <div className="space-y-8">
            <div>
              <h2 className="font-secondary text-2xl sm:text-3xl text-[#0a2225] tracking-tight">About the guide</h2>
              <p className="text-sm text-[#9A9384] mt-1">The essentials travelers see before buying.</p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses}>Title</Label>
                  <Input className={inputClasses} value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="7 Days in Lisbon — A local's guide" />
                  <p className={helperClasses}>Be specific. "7 Days in Lisbon — Local's Guide" outperforms "Lisbon Guide".</p>
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Destination</Label>
                  <Input className={inputClasses} value={form.destination}
                    onChange={(e) => update("destination", e.target.value)} placeholder="Lisbon, Portugal" />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Duration (days)</Label>
                  <Input type="number" min={1} max={60} className={inputClasses}
                    value={form.duration_days} onChange={(e) => setDuration(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className={labelClasses}>Price</Label>
                    <Input type="number" min={0} step="0.01" className={inputClasses}
                      value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="29" />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClasses}>Currency</Label>
                    <Select value={form.currency} onValueChange={(v) => update("currency", v)}>
                      <SelectTrigger className={inputClasses}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className={labelClasses}>Cover image</Label>
                <TripImageUploader currentUrl={form.cover_image_url}
                  onUpload={(url) => update("cover_image_url", url)} />
              </div>

              <div className="space-y-2">
                <Label className={labelClasses}>Description</Label>
                <Textarea className={textareaClasses} rows={5} value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="What travelers will get inside this guide..." />
                <p className={helperClasses}>Aim for 100–200 words. Highlight what makes your local knowledge unique.</p>
              </div>
            </div>
          </div>

          {/* Day by day */}
          <div className="space-y-8 border-t border-[#E5DFC6] pt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-secondary text-2xl sm:text-3xl text-[#0a2225] tracking-tight">Day by day</h2>
                <p className="text-sm text-[#9A9384] mt-1">Walk travelers through the journey, day by day.</p>
              </div>
              <Button type="button" variant="outline" size="sm"
                onClick={() => setDays((p) => [...p, { day_number: p.length + 1, title: "", description: "", activities: [], accommodation: "" }])}
                className="rounded-full border-[#E5DFC6]">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add day
              </Button>
            </div>

            <div>
              {days.map((d, idx) => (
                <div key={idx} className={idx > 0 ? "border-t border-[#E5DFC6] pt-6 mt-6" : ""}>
                  <div className="flex items-start gap-5">
                    <span className="font-secondary text-4xl text-[#E5DFC6] leading-none flex-shrink-0 mt-1">
                      {String(d.day_number).padStart(2, "0")}
                    </span>
                    <div className="flex-1 space-y-4 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <Input className={inputClasses} value={d.title}
                          onChange={(e) => patchDay(idx, { title: e.target.value })}
                          placeholder="Day title" />
                        {days.length > 1 && (
                          <button type="button"
                            onClick={() => setDays((p) => p.filter((_, i) => i !== idx).map((x, i) => ({ ...x, day_number: i + 1 })))}
                            className="text-[#9A9384] hover:text-[#0a2225] mt-3 flex-shrink-0"
                            aria-label="Remove day">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <Textarea className={textareaClasses} rows={3} value={d.description}
                        onChange={(e) => patchDay(idx, { description: e.target.value })}
                        placeholder="What happens this day" />
                      <div className="space-y-2">
                        <Label className={labelClasses}>Activities</Label>
                        <ArrayFieldEditor items={d.activities}
                          onChange={(items) => patchDay(idx, { activities: items })}
                          placeholder="Add an activity" />
                      </div>
                      <div className="space-y-2">
                        <Label className={labelClasses}>Accommodation (optional)</Label>
                        <Input className={inputClasses} value={d.accommodation}
                          onChange={(e) => patchDay(idx, { accommodation: e.target.value })}
                          placeholder="Where to stay" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-[#E5DFC6] pt-8">
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}
              className="rounded-full px-6 border-[#E5DFC6] hover:bg-[#FDF9F0] text-[#0a2225]">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save draft
            </Button>
            {editId && (
              <Button
                variant="outline"
                onClick={() => window.open(`/itinerary-guide/${editId}?preview=1`, "_blank", "noopener")}
                className="rounded-full px-6 border-[#E5DFC6] hover:bg-[#FDF9F0] text-[#0a2225]"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview as buyer
              </Button>
            )}
            <Button onClick={() => handleSave("published")} disabled={saving}
              className="rounded-full px-6 bg-[#0c4d47] hover:bg-[#0c4d47]/90 text-white">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Publish guide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
