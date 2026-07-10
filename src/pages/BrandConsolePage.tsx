import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ExternalLink, ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, ChevronUp, ChevronDown, Image as ImageIcon } from "lucide-react";
import { CollectionStatsWidget } from "@/components/brand/CollectionStatsWidget";

interface BrandConsoleProfile {
  profile_id: string;
  name: string;
  avatar_url?: string | null;
  categories?: string[] | null;
  regions?: string[] | null;
  tags?: string[] | null;
}

interface DailyStats {
  event_date: string;
  discovered_count: number;
  profile_view_count: number;
  moodboard_save_count: number;
  trip_inquiry_count: number;
}

interface BrandCollection {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  is_published: boolean;
  sort_order: number | null;
}

export default function BrandConsolePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<BrandConsoleProfile | null>(null);
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"house" | "collections" | "inquiries" | "performance">("house");
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const draftReply = async (inq: any) => {
    setDraftingId(inq.id);
    try {
      const { data, error } = await supabase.functions.invoke("ai-proposal-polish", {
        body: {
          mode: "inquiry_reply",
          inquiry_message: inq.message,
          sender_name: inq.sender_name || "the traveler",
          brand_name: profile?.name || "our house",
          brand_bio: (profile as any)?.bio || "",
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.reply) throw new Error(data?.error || "Draft came back empty");
      setDrafts((d) => ({ ...d, [inq.id]: String(data.reply) }));
    } catch (e: any) {
      toast.error(`Couldn't draft a reply: ${e.message}`);
    } finally {
      setDraftingId(null);
    }
  };

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);

      // 1) Get brand's profile_id from brand_profiles_discovery or profiles
      const { data: brand, error: brandError } = await supabase
        .from("brand_profiles_discovery")
        .select("profile_id, name, avatar_url, categories, regions, tags")
        .eq("user_id", user.id)
        .maybeSingle();

      if (brandError || !brand) {
        setProfile(null);
        setStats([]);
        setLoading(false);
        return;
      }

      const profileData: BrandConsoleProfile = {
        profile_id: brand.profile_id,
        name: brand.name,
        avatar_url: brand.avatar_url,
        categories: brand.categories,
        regions: brand.regions,
        tags: brand.tags,
      };

      setProfile(profileData);

      // 2) Load last 30 days of stats for this brand
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data: statRows, error: statsError } = await supabase
        .from("brand_engagement_daily_stats")
        .select(
          "event_date, discovered_count, profile_view_count, moodboard_save_count, trip_inquiry_count"
        )
        .eq("brand_profile_id", profileData.profile_id)
        .gte("event_date", since.toISOString().slice(0, 10))
        .order("event_date", { ascending: true });

      if (!statsError && statRows) {
        setStats(statRows as DailyStats[]);
      }

      // Inquiries — non-fatal (table ships with maison-inquiries.sql)
      try {
        const { data: inq } = await supabase
          .from("brand_inquiries")
          .select("id, sender_name, message, status, created_at")
          .eq("brand_profile_id", profileData.profile_id)
          .order("created_at", { ascending: false });
        setInquiries(inq ?? []);
      } catch (inqErr) {
        console.error("Inquiries load failed (non-fatal):", inqErr);
      }

      setLoading(false);
    };

    void load();
  }, [user]);

  const totals = useMemo(() => {
    return stats.reduce(
      (acc, row) => {
        acc.discoveries += row.discovered_count;
        acc.profileViews += row.profile_view_count;
        acc.moodboardSaves += row.moodboard_save_count;
        acc.tripInquiries += row.trip_inquiry_count;
        return acc;
      },
      {
        discoveries: 0,
        profileViews: 0,
        moodboardSaves: 0,
        tripInquiries: 0,
      }
    );
  }, [stats]);

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-[#4a4a4a]">
          Sign in to access your brand console.
        </p>
      </div>
    );
  }

  async function markReplied(id: string) {
    try {
      const { error } = await supabase
        .from("brand_inquiries")
        .update({ status: "replied" })
        .eq("id", id);
      if (error) throw error;
      setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status: "replied" } : i)));
    } catch (e: any) {
      toast.error(e.message || "Couldn't update the inquiry");
    }
  }

  const tabBtn = (val: typeof activeTab, label: string) => (
    <button
      key={val}
      type="button"
      onClick={() => setActiveTab(val)}
      className={`whitespace-nowrap pb-4 text-[12px] uppercase tracking-[0.22em] transition-colors ${
        activeTab === val
          ? "border-b-2 border-[#0a2225] text-[#0a2225]"
          : "border-b-2 border-transparent text-[#0a2225]/50 hover:text-[#0a2225]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <Helmet>
        <title>The Maison · Goldsainte</title>
      </Helmet>

      <div className="min-h-screen bg-[#f7f3ea]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
              ))}
            </div>
          ) : !profile ? (
            <div className="mx-auto max-w-md rounded-2xl bg-white px-8 py-12 text-center shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
              <p className="text-[11px] uppercase tracking-[0.34em] text-[#8D6B2F]">The Maison</p>
              <h1 className="mt-3 font-secondary text-[28px] text-[#0a2225]">Set up your house</h1>
              <p className="mt-3 text-[14.5px] leading-relaxed text-[#0a2225]/55">
                Tell us about your operation and we'll open your storefront on Goldsainte.
              </p>
              <button
                type="button"
                onClick={() => navigate("/apply/tour-operator")}
                className="mt-7 rounded-full bg-[#0c4d47] px-8 py-3.5 text-[14px] text-white transition-colors hover:bg-[#0a2225]"
              >
                Apply as a tour operator
              </button>
            </div>
          ) : (
            <>
              {/* ── The Maison ── */}
              <p className="text-[11px] uppercase tracking-[0.34em] text-[#8D6B2F]">The Maison</p>
              <div className="mt-2 flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-xl">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#0c4d47]">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-secondary text-[20px] text-[#E5DFC6]">
                          {profile.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h1 className="font-secondary text-[40px] leading-[1.08] text-[#0a2225] md:text-[50px]">
                      {profile.name}
                    </h1>
                  </div>
                  <p className="mt-4 text-[16px] leading-relaxed text-[#0a2225]/55">
                    Your house on Goldsainte — where the specialists and travelers designing
                    journeys discover what you offer.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    {(profile.categories ?? []).slice(0, 3).map((c) => (
                      <span key={c} className="inline-flex items-center rounded-full border border-[#C7A962] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-[#8D6B2F]">
                        {c}
                      </span>
                    ))}
                    {(profile.regions ?? []).slice(0, 2).map((r) => (
                      <span key={r} className="inline-flex items-center rounded-full border border-[#0a2225]/18 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-[#0a2225]/60">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/brands/${profile.profile_id}`)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#0a2225]/25 px-6 py-3.5 text-[14px] text-[#0a2225] transition-colors hover:bg-white"
                >
                  <ExternalLink className="h-4 w-4" /> View your storefront
                </button>
              </div>

              {/* ── Your house today ── */}
              <div className="mt-10 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                {[
                  { k: "Discoveries", v: totals.discoveries, l: "Last 30 days" },
                  { k: "Storefront views", v: totals.profileViews, l: "Last 30 days" },
                  { k: "Moodboard saves", v: totals.moodboardSaves, l: "Travelers keeping you in mind" },
                  { k: "Trip inquiries", v: totals.tripInquiries, l: "Last 30 days" },
                ].map((x) => (
                  <div key={x.k} className="rounded-2xl bg-white px-5 py-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#0a2225]/50">{x.k}</p>
                    <p className="mt-1.5 font-secondary text-[30px] leading-none text-[#0a2225]">{x.v}</p>
                    <p className="mt-2 text-[11.5px] text-[#0a2225]/45">{x.l}</p>
                  </div>
                ))}
              </div>

              {/* ── Tabs ── */}
              <div className="mt-12 flex items-center gap-8 overflow-x-auto border-b border-[#0a2225]/12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {tabBtn("house", "House")}
                {tabBtn("collections", "Collections")}
                {tabBtn("inquiries", `Inquiries${inquiries.filter((i) => i.status === "new").length ? ` (${inquiries.filter((i) => i.status === "new").length})` : ""}`)}
                {tabBtn("performance", "Performance")}
              </div>

              {activeTab === "house" && (
                <div>
                  <div className="border-b border-[#0a2225]/10 pb-16 pt-10">
                    <p className="text-[11px] uppercase tracking-[0.34em] text-[#8D6B2F]">Start here</p>
                    <h2 className="mt-4 max-w-3xl font-secondary text-[42px] leading-[1.08] text-[#0a2225] md:text-[56px]">
                      Be found by the people building&nbsp;trips.
                    </h2>
                    <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[#0a2225]/55">
                      Every day on Goldsainte, agents and creators design journeys for travelers
                      who want the real thing. Your collections put your experiences directly in
                      their hands.
                    </p>
                    <div className="mt-9 flex flex-wrap items-center gap-6">
                      <button
                        type="button"
                        onClick={() => setActiveTab("collections")}
                        className="rounded-full bg-[#0c4d47] px-9 py-4 text-[15px] text-white transition-colors hover:bg-[#0a2225]"
                      >
                        Add a collection
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/brands/${profile.profile_id}`)}
                        className="inline-flex items-center gap-2 text-[15px] text-[#0a2225]"
                      >
                        Or view your storefront <ArrowRight className="h-4 w-4 text-[#8D6B2F]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/profile/media")}
                        className="inline-flex items-center gap-2 text-[15px] text-[#0a2225]"
                      >
                        Add photos & video <ArrowRight className="h-4 w-4 text-[#8D6B2F]" />
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-[#0a2225]/10 py-16">
                    <p className="text-[11px] uppercase tracking-[0.34em] text-[#8D6B2F]">
                      How Goldsainte works for operators
                    </p>
                    <h2 className="mt-3 font-secondary text-[38px] text-[#0a2225]">Two ways to grow</h2>
                    <div className="mt-10 grid gap-14 md:grid-cols-2">
                      <div>
                        <p className="font-secondary text-[20px] text-[#8D6B2F]">01</p>
                        <h3 className="mt-1.5 font-secondary text-[26px] text-[#0a2225]">Curate your house</h3>
                        <div className="mt-5 space-y-4 text-[15.5px] leading-relaxed text-[#0a2225]/80">
                          <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">i.</i>Publish collections — the experiences, regions, and seasons you're known for.</p>
                          <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">ii.</i>Travelers discover you, save you to moodboards, and send inquiries.</p>
                          <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">iii.</i>Specialists browse your storefront when designing trips for their clients.</p>
                        </div>
                      </div>
                      <div>
                        <p className="font-secondary text-[20px] text-[#8D6B2F]">02</p>
                        <h3 className="mt-1.5 font-secondary text-[26px] text-[#0a2225]">Partner on bookings</h3>
                        <div className="mt-5 space-y-4 text-[15.5px] leading-relaxed text-[#0a2225]/80">
                          <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">i.</i>When an agent builds your experience into a client's journey, the booking runs through Goldsainte.</p>
                          <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">ii.</i>Funds are held in escrow, protected by a signed contract, until milestones complete.</p>
                          <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">iii.</i>You're paid your price — Goldsainte's take is flat and transparent.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid items-center gap-10 py-14 md:grid-cols-[1fr_auto]">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.34em] text-[#8D6B2F]">How you get paid</p>
                      <p className="mt-4 max-w-2xl text-[16px] leading-[1.7] text-[#0a2225]/80">
                        You set your price — your costs and your margin are yours to build in.
                        Travelers pay a 3.5% service fee on top; a matching 3.5% platform fee comes
                        out of the payout. That is Goldsainte's entire take: 7% total, flat, on
                        every booking. Every payment is held in escrow — protected by a signed
                        contract — and releases as milestones complete.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-secondary text-[58px] leading-none text-[#0a2225]">7%</p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-[#0a2225]/50">Total · 3.5 + 3.5</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "collections" && (
                <div className="space-y-8 pt-10">
                  <CollectionStatsWidget brandProfileId={profile.profile_id} />
                  <CollectionsSection brandProfileId={profile.profile_id} />
                </div>
              )}

              {activeTab === "inquiries" && (
                <div className="space-y-4 pt-10">
                  {inquiries.length === 0 ? (
                    <div className="rounded-2xl bg-white px-8 py-14 text-center shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                      <MessageCircle className="mx-auto h-8 w-8 text-[#C7A962]" />
                      <h3 className="mt-4 font-secondary text-[22px] text-[#0a2225]">No inquiries yet</h3>
                      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-[#0a2225]/50">
                        When travelers reach out from your storefront, their messages land here.
                      </p>
                    </div>
                  ) : (
                    inquiries.map((inq) => (
                      <div key={inq.id} className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0c4d47] text-[12px] font-medium text-[#E5DFC6]">
                              {String(inq.sender_name || "T").trim().charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <p className="text-[15px] font-medium text-[#0a2225]">{inq.sender_name || "Traveler"}</p>
                              <p className="text-[12px] text-[#0a2225]/45">
                                {new Date(inq.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                              </p>
                            </div>
                          </div>
                          {inq.status === "replied" ? (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0c4d47]">
                              <CheckCircle2 className="h-4 w-4" /> Replied
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#C7A962]/15 px-3 py-1 text-[10.5px] uppercase tracking-[0.14em] text-[#8D6B2F]">New</span>
                          )}
                        </div>
                        <p className="mt-4 text-[14.5px] leading-relaxed text-[#0a2225]/80">{inq.message}</p>
                        {drafts[inq.id] && (
                          <div className="mt-4 rounded-xl border border-[#E5DFC6] bg-[#fdfaf2] p-4">
                            <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Suggested reply</p>
                            <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-[#0a2225]/80">{drafts[inq.id]}</p>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(drafts[inq.id]);
                                toast.success("Reply copied — paste it in Messages.");
                              }}
                              className="mt-3 rounded-full bg-[#0c4d47] px-4 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
                            >
                              Copy reply
                            </button>
                          </div>
                        )}
                        <div className="mt-4 flex flex-wrap justify-end gap-2.5">
                          <button
                            type="button"
                            disabled={draftingId === inq.id}
                            onClick={() => draftReply(inq)}
                            className="rounded-full border border-[#C7A962]/50 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8D6B2F] transition-colors hover:bg-[#C7A962]/10 disabled:opacity-50"
                          >
                            {draftingId === inq.id ? "Drafting…" : "Draft reply with AI"}
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate("/messages")}
                            className="rounded-full border border-[#0a2225]/20 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#0a2225]/70 transition-colors hover:bg-[#f7f3ea]"
                          >
                            Reply in Messages
                          </button>
                          {inq.status !== "replied" && (
                            <button
                              type="button"
                              onClick={() => markReplied(inq.id)}
                              className="rounded-full bg-[#0c4d47] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
                            >
                              Mark replied
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "performance" && (
                <div className="space-y-8 pt-10">
                  <section className="grid gap-4 md:grid-cols-4">
                    <MetricCard label="Discoveries" value={totals.discoveries} helper="Times you appeared in AI & search results (last 30 days)." />
                    <MetricCard label="Storefront views" value={totals.profileViews} helper="Travelers who opened your storefront." />
                    <MetricCard label="Moodboard saves" value={totals.moodboardSaves} helper="Saves of your house into traveler moodboards." />
                    <MetricCard label="Trip inquiries" value={totals.tripInquiries} helper="Travelers who reached out." />
                  </section>
                  <Card className="rounded-2xl border-0 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-[13px] uppercase tracking-[0.18em] text-[#8D6B2F]">
                        Storefront views · Last 14 days
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ProfileViewsSparkline stats={stats} />
                    </CardContent>
                  </Card>
                  <section className="space-y-3 rounded-2xl bg-white px-6 py-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                    <h2 className="text-[11px] uppercase tracking-[0.28em] text-[#8D6B2F]">
                      How Goldsainte AI sees your house
                    </h2>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {(profile.categories ?? []).map((c) => (
                        <span key={c} className="rounded-full border border-[#C7A962]/60 px-3 py-1 uppercase tracking-wide text-[#8D6B2F]">{c}</span>
                      ))}
                      {(profile.regions ?? []).map((r) => (
                        <span key={r} className="rounded-full bg-[#f7f3ea] px-3 py-1 text-[#0a2225]/60">{r}</span>
                      ))}
                      {(profile.tags ?? []).map((tag) => (
                        <span key={tag} className="rounded-full border border-dashed border-[#E5DFC6] px-3 py-1 text-[#0a2225]/60">{tag}</span>
                      ))}
                    </div>
                    <p className="text-[13px] leading-relaxed text-[#0a2225]/55">
                      These signals help Goldsainte AI match you with travelers building moodboards
                      around sustainability, aesthetics, regions, and travel style.
                    </p>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  helper?: string;
}

function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-[#E5DFC6] bg-white px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-[#7A7151]">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-[#0a2225]">
        {value}
      </p>
      {helper && (
        <p className="mt-1 text-[11px] text-[#8C8470]">
          {helper}
        </p>
      )}
    </div>
  );
}

function ProfileViewsSparkline({ stats }: { stats: DailyStats[] }) {
  // Last 14 days, but keep the sequence
  const sliced = stats.slice(-14);

  const data = sliced.map((row) => ({
    date: row.event_date.slice(5), // "MM-DD" for display
    value: row.profile_view_count,
  }));

  if (!data.length) {
    return (
      <p className="text-xs text-[#8C8470]">
        Once travelers start viewing your profile, you&apos;ll see a daily trend here.
      </p>
    );
  }

  return (
    <div className="h-20 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Tooltip
            formatter={(val) => [`${val} views`, "Profile views"]}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0a2225"
            strokeWidth={1.8}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CollectionsSection({ brandProfileId }: { brandProfileId: string }) {
  const [collections, setCollections] = useState<BrandCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("brand_collections")
        .select(
          "id, title, description, cover_image_url, tags, is_published, sort_order"
        )
        .eq("brand_profile_id", brandProfileId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!error && data) {
        const withOrder = (data as BrandCollection[]).map((c, index) => ({
          ...c,
          sort_order:
            c.sort_order !== null && c.sort_order !== undefined
              ? c.sort_order
              : index,
        }));
        setCollections(withOrder);
      }
      setLoading(false);
    };

    void load();
  }, [brandProfileId]);

  const getNextSortOrder = () => {
    if (!collections.length) return 0;
    const max = Math.max(...collections.map((c) => c.sort_order ?? 0));
    return max + 1;
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);

    const sortOrder = getNextSortOrder();

    const { data, error } = await supabase
      .from("brand_collections")
      .insert({
        brand_profile_id: brandProfileId,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        sort_order: sortOrder,
      })
      .select(
        "id, title, description, cover_image_url, tags, is_published, sort_order"
      )
      .single();

    if (!error && data) {
      setCollections((prev) => [
        ...(prev || []),
        data as BrandCollection,
      ]);
      setNewTitle("");
      setNewDescription("");
    }

    setCreating(false);
  };

  const updateCollection = async (
    id: string,
    payload: Partial<BrandCollection>
  ) => {
    const { data, error } = await supabase
      .from("brand_collections")
      .update(payload)
      .eq("id", id)
      .select(
        "id, title, description, cover_image_url, tags, is_published, sort_order"
      )
      .single();

    if (!error && data) {
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? (data as BrandCollection) : c))
      );
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === collections.length - 1) return;

    const current = collections[index];
    const target = collections[direction === "up" ? index - 1 : index + 1];

    const currentOrder = current.sort_order ?? index;
    const targetOrder = target.sort_order ?? (direction === "up" ? index - 1 : index + 1);

    // Swap sort_order values
    const { error: err1 } = await supabase
      .from("brand_collections")
      .update({ sort_order: targetOrder })
      .eq("id", current.id);

    const { error: err2 } = await supabase
      .from("brand_collections")
      .update({ sort_order: currentOrder })
      .eq("id", target.id);

    if (!err1 && !err2) {
      // Update local state
      const updated = [...collections];
      updated[index] = { ...current, sort_order: targetOrder };
      updated[direction === "up" ? index - 1 : index + 1] = {
        ...target,
        sort_order: currentOrder,
      };
      updated.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      setCollections(updated);
    }
  };

  const handleCoverUpload = async (collection: BrandCollection, file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${collection.id}-${Date.now()}.${fileExt}`;
    const filePath = `${collection.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("brand-collections")
      .upload(filePath, file);

    if (uploadError) {
      console.error(uploadError);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("brand-collections").getPublicUrl(filePath);

    await updateCollection(collection.id, { cover_image_url: publicUrl });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
          Collections
        </h2>
      </div>

      <div className="space-y-4 rounded-2xl border border-[#E5DFC6] bg-white px-4 py-4">
        <p className="text-xs text-[#4a4a4a]">
          Create Pinterest-style boards that showcase your brand's world:
          lookbooks, routes, experiences, and seasonal edits. These collections
          appear on your public brand profile.
        </p>

        {/* Create collection */}
        <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-2">
            <Input
              placeholder="Collection title (e.g. Eco Island Escapes)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              rows={3}
              placeholder="Optional description to help travelers understand this collection."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <Button
              size="sm"
              disabled={creating || !newTitle.trim()}
              onClick={handleCreate}
            >
              {creating ? "Creating…" : "Create collection"}
            </Button>
          </div>

          {/* Existing collections */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {loading ? (
              <div className="h-24 animate-pulse rounded-xl bg-[#F5F0E0]" />
            ) : collections.length === 0 ? (
              <p className="text-xs text-[#8C8470]">
                You haven&apos;t created any collections yet. Start with one
                strong board that represents your signature aesthetic.
              </p>
            ) : (
              collections.map((c, index) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-2 rounded-xl border border-[#E5DFC6] bg-[#FDFBF5] p-3"
                >
                  <div className="flex items-center gap-3">
                    {/* Cover image / upload */}
                    <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-[#F5F0E0]">
                      {c.cover_image_url ? (
                        <img
                          src={c.cover_image_url}
                          alt={c.title}
                          className="h-full w-full object-cover"
                        loading="lazy"/>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-[10px] text-[#0a2225]">
                          <ImageIcon className="mb-1 h-4 w-4" />
                          No cover
                        </div>
                      )}
                      <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                        <Upload className="h-4 w-4 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCoverUpload(c, file);
                          }}
                        />
                      </label>
                    </div>

                    {/* Title + publish toggle + reorder */}
                    <div className="flex-1 space-y-1">
                      <Input
                        className="h-7 text-xs"
                        value={c.title}
                        onChange={(e) =>
                          updateCollection(c.id, { title: e.target.value })
                        }
                      />
                      <Textarea
                        className="h-16 text-[11px]"
                        value={c.description ?? ""}
                        placeholder="Short description (optional)"
                        onChange={(e) =>
                          updateCollection(c.id, {
                            description: e.target.value || null,
                          })
                        }
                      />
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {/* Publish toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-[#7A7151]">
                          {c.is_published ? "Published" : "Draft"}
                        </span>
                        <Checkbox
                          checked={c.is_published}
                          onCheckedChange={(checked) =>
                            updateCollection(c.id, {
                              is_published: Boolean(checked),})
                          }
                        />
                      </div>

                      {/* Reorder controls */}
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          disabled={index === 0}
                          onClick={() => handleMove(index, "up")}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          disabled={index === collections.length - 1}
                          onClick={() => handleMove(index, "down")}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
