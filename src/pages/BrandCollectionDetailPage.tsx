import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TripRequestModal } from "@/components/trips/TripRequestModal";
import { CollectionHeroCollage } from "@/components/brand/CollectionHeroCollage";
import { TripSummaryChips } from "@/components/brand/TripSummaryChips";
import { CollectionSidebar } from "@/components/brand/CollectionSidebar";
import { ArrowLeft, MapPin } from "lucide-react";

interface BrandProfile {
  profile_id: string;
  name: string;
  avatar_url?: string | null;
  categories?: string[] | null;
  regions?: string[] | null;
  tags?: string[] | null;
}

interface BrandCollection {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  is_published: boolean;
}

interface RelatedCollection {
  id: string;
  title: string;
  cover_image_url: string | null;
  tags: string[] | null;
}

export default function BrandCollectionDetailPage() {
  const { profileId, collectionId } = useParams();
  const navigate = useNavigate();

  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [collection, setCollection] = useState<BrandCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [related, setRelated] = useState<RelatedCollection[]>([]);

  // Load brand + collection
  useEffect(() => {
    if (!profileId || !collectionId) return;

    const load = async () => {
      setLoading(true);

      // 1) Brand
      const { data: brandData, error: brandError } = await supabase
        .from("brand_profiles_discovery")
        .select("profile_id, name, avatar_url, categories, regions, tags")
        .eq("profile_id", profileId)
        .maybeSingle();

      if (!brandError && brandData) {
        setBrand(brandData as BrandProfile);
      }

      // 2) Collection (only if published)
      const { data: collData, error: collError } = await supabase
        .from("brand_collections")
        .select(
          "id, title, description, cover_image_url, tags, is_published"
        )
        .eq("id", collectionId)
        .eq("brand_profile_id", profileId)
        .maybeSingle();

      if (!collError && collData) {
        const c = collData as BrandCollection;
        if (!c.is_published) {
          // treat unpublished as not found for travelers
          setCollection(null);
        } else {
          setCollection(c);
        }
      } else {
        setCollection(null);
      }

      setLoading(false);
    };

    void load();
  }, [profileId, collectionId]);

  // Load related collections once the current collection is known
  useEffect(() => {
    if (!brand || !collection) return;

    const loadRelated = async () => {
      const tagFilter = collection.tags && collection.tags.length > 0;
      const query = supabase
        .from("brand_collections")
        .select("id, title, cover_image_url, tags")
        .eq("brand_profile_id", brand.profile_id)
        .neq("id", collection.id)
        .order("sort_order", { ascending: true })
        .limit(6);

      if (tagFilter) {
        query.contains("tags", collection.tags);
      }

      const { data, error } = await query;
      if (!error && data) {
        setRelated(data as RelatedCollection[]);
      }
    };

    void loadRelated();
  }, [brand, collection]);

  // Log collection view once we have the brand + collection
  useEffect(() => {
    if (!brand || !collection) return;

    void supabase.rpc("log_brand_engagement", {
      p_brand_profile_id: brand.profile_id,
      p_event_type: "profile_view",
      p_context_type: "brand_collection",
      p_context_id: collection.id,
      p_metadata: {},
    });
  }, [brand, collection]);

  const highlightTags = useMemo(
    () => collection?.tags ?? brand?.tags ?? [],
    [collection, brand]
  );

  const storyboardContext = useMemo(
    () => ({
      tags: collection?.tags ?? brand?.tags ?? [],
    }),
    [collection, brand]
  );

  const handleTripInquiry = () => {
    if (!brand || !collection) return;
    setTripModalOpen(true);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-40 animate-pulse rounded-2xl bg-[#F5F0E0]" />
      </div>
    );
  }

  if (!brand || !collection) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs text-[#4a4a4a]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>
        <p className="text-sm text-[#4a4a4a]">
          We couldn&apos;t find this collection. It may have been removed or is
          not currently published.
        </p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {collection.title} · {brand.name} · Goldsainte
        </title>
      </Helmet>

      <div className="bg-[#FDF9F0]">
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
          <Link
            to={`/brands/${brand.profile_id}`}
            className="inline-flex items-center gap-2 text-[12px] text-[#7A7151] underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to {brand.name}
          </Link>

          {/* Hero collage */}
          <div className="mt-6">
            <CollectionHeroCollage
              mainImageUrl={collection.cover_image_url || "/placeholder.svg"}
              secondaryImageUrl={collection.cover_image_url}
              tertiaryImageUrl={collection.cover_image_url}
              title={collection.title}
            />
          </div>

          {/* Title + tags + CTA row */}
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#A4987C]">
                Brand collection
              </p>
              <h1 className="font-secondary text-2xl text-[#0a2225] md:text-3xl">
                {collection.title}
              </h1>
              <p className="text-[13px] text-[#6E6650]">
                By {brand.name}
                {brand.regions && brand.regions.length > 0 && (
                  <span className="ml-1 inline-flex items-center gap-1">
                    <MapPin className="inline h-3 w-3" />
                    {brand.regions.slice(0, 3).join(" • ")}
                  </span>
                )}
              </p>
              {highlightTags && highlightTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {highlightTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#F5EFE1] px-2 py-[2px] text-[11px] text-[#574E3D]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile CTA */}
            <div className="md:hidden space-y-2">
              <Button
                onClick={handleTripInquiry}
                className="w-full rounded-full bg-[#0a2225] px-4 py-2.5 text-[13px] font-medium text-[#FDFBF5] hover:bg-[#123338]"
              >
                Request a trip like this
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Overview */}
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A4987C]">
                Overview
              </h2>
              {collection.description && (
                <p className="mt-3 text-[13px] leading-relaxed text-[#4A4A4A] whitespace-pre-line">
                  {collection.description}
                </p>
              )}
            </section>

            {/* Trip blueprint chips */}
            <TripSummaryChips
              duration="3 nights · 4 days"
              season="Best between October and March"
              style="Design-led · wellness-forward"
              budgetBand="From $4,200 per person"
              pace="Slow mornings, long sunsets"
            />

            <p className="text-[11px] text-[#8C8470]">
              Use this collection as a starting point. Your Goldsainte creator
              or agent can adapt it to your dates, budget, and preferences.
            </p>
          </div>

          {/* Right sidebar (desktop only) */}
          <div className="hidden lg:block space-y-3">
            <CollectionSidebar
              brandName={brand.name}
              startingPriceLabel="From $4,200 pp"
              onRequestTrip={handleTripInquiry}
              className="sticky top-8"
            />
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-8 space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A4987C]">
              Related collections
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  to={`/brands/${brand.profile_id}/collections/${item.id}`}
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-[#E5DFC6] bg-white"
                >
                  <div className="h-32 w-full overflow-hidden bg-[#F5F0E0]">
                    {item.cover_image_url ? (
                      <img
                        src={item.cover_image_url}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"/>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[#8C8470]">
                        Preview coming soon
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="text-sm font-semibold text-[#0a2225]">{item.title}</p>
                    {item.tags && item.tags.length > 0 && (
                      <p className="text-[11px] text-[#7A7151]">
                        {item.tags.slice(0, 3).join(" • ")}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {brand && collection && (
        <TripRequestModal
          open={tripModalOpen}
          onClose={() => setTripModalOpen(false)}
          brand={brand}
          collection={collection}
          storyboardContext={storyboardContext}
        />
      )}
    </>
  );
}
