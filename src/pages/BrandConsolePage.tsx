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
  const [profile, setProfile] = useState<BrandConsoleProfile | null>(null);
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <Helmet>
        <title>Brand Console · Goldsainte</title>
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-[#F5F0E0]">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                loading="lazy"/>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#0a2225]">
                  {profile?.name
                    ? profile.name.slice(0, 2).toUpperCase()
                    : "GS"}
                </div>
              )}
            </div>
            <div>
              <h1 className="font-display text-xl text-[#0a2225]">
                {profile?.name ?? "Your Brand"}
              </h1>
              <p className="text-xs text-[#7A7151]">
                Brand Console · Goldsainte Discovery
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.open("/marketplace?tab=brands", "_blank")}
            className="rounded-full bg-[#0a2225] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#E5DFC6]"
          >
            View as traveler
          </button>
        </header>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-[#F5F0E0]" />
            ))}
          </div>
        ) : (
          <>
            {profile?.profile_id && (
              <CollectionStatsWidget brandProfileId={profile.profile_id} />
            )}

            {/* Metrics summary */}
            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard
                label="Discoveries"
                value={totals.discoveries}
                helper="Times you appeared in AI & search results (last 30 days)."
              />
              <MetricCard
                label="Profile Views"
                value={totals.profileViews}
                helper="Travelers who opened your brand profile."
              />
              <MetricCard
                label="Moodboard Saves"
                value={totals.moodboardSaves}
                helper="Saves of your brand into traveler moodboards."
              />
              <MetricCard
                label="Trip Inquiries"
                value={totals.tripInquiries}
                helper="Travelers who started a trip conversation."
              />
            </section>

            {/* Sparkline card for profile views */}
            <section>
              <Card className="bg-white border-[#E5DFC6]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#0a2225]">
                    Profile Views · Last 14 days
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ProfileViewsSparkline stats={stats} />
                </CardContent>
              </Card>
            </section>

            {/* "How AI sees you" */}
            {profile && (
              <section className="space-y-3 rounded-2xl border border-[#E5DFC6] bg-white px-4 py-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                  How Goldsainte AI sees your brand
                </h2>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {(profile.categories ?? []).map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-[#E5DFC6] px-3 py-1 uppercase tracking-wide text-[#7A7151]"
                    >
                      {c}
                    </span>
                  ))}
                  {(profile.regions ?? []).map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-[#F5F0E0] px-3 py-1 text-[#4a4a4a]"
                    >
                      {r}
                    </span>
                  ))}
                  {(profile.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-dashed border-[#E5DFC6] px-3 py-1 text-[#4a4a4a]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-[#4a4a4a]">
                  These signals help Goldsainte AI match you with travelers building
                  moodboards around sustainability, aesthetics, regions, and travel
                  style.
                </p>
              </section>
            )}

            {/* Collections section */}
            {profile && (
              <CollectionsSection brandProfileId={profile.profile_id} />
            )}
          </>
        )}
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
