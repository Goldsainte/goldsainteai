import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { TravelStoryboard } from "@/components/storyboards/TravelStoryboard";

interface BrandProfile {
  profile_id: string;
  name: string;
  avatar_url?: string | null;
  bio?: string | null;
  categories?: string[] | null;
  regions?: string[] | null;
  supplier_type?: string | null;
  supplier_rating?: number | null;
  supplier_reviews?: number | null;
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

export default function BrandProfilePage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [collections, setCollections] = useState<BrandCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;

    const loadBrand = async () => {
      setLoading(true);
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/brand_profiles_discovery?profile_id=eq.${profileId}`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const brandData = data[0] as BrandProfile;
            setBrand(brandData);
            
            // Load collections for this brand
            const { data: collData } = await supabase
              .from("brand_collections")
              .select("id, title, description, cover_image_url, tags, is_published, sort_order")
              .eq("brand_profile_id", brandData.profile_id)
              .eq("is_published", true)
              .order("sort_order", { ascending: true })
              .order("created_at", { ascending: false });

            if (collData) {
              setCollections(collData as BrandCollection[]);
            }
          } else {
            setBrand(null);
          }
        } else {
          setBrand(null);
        }
      } catch (err) {
        console.error('Error loading brand:', err);
        setBrand(null);
      }
      
      setLoading(false);
    };

    void loadBrand();
  }, [profileId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-40 animate-pulse rounded-2xl bg-[#F5F0E0]" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-[#4a4a4a]">
          We couldn't find this brand. It may have been removed or is still being
          onboarded.
        </p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{brand.name} · Goldsainte Brands</title>
      </Helmet>

      <div className="border-b border-[#E5DFC6]/40 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-[#F5F0E0]">
                {brand.avatar_url ? (
                  <img
                    src={brand.avatar_url}
                    alt={brand.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[#0a2225]">
                    {brand.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-display text-2xl text-[#0a2225]">
                  {brand.name}
                </h1>
                {brand.supplier_type && (
                  <p className="text-[11px] uppercase tracking-wide text-[#7A7151]">
                    {brand.supplier_type}
                  </p>
                )}
                {brand.regions && brand.regions.length > 0 && (
                  <p className="mt-1 text-xs text-[#4a4a4a]">
                    Operating in {brand.regions.slice(0, 3).join(" • ")}
                  </p>
                )}
              </div>
            </div>

            {brand.supplier_rating && (
              <div className="rounded-2xl border border-[#E5DFC6] bg-[#F5F0E0] px-4 py-3 text-sm text-[#0a2225]">
                <div className="font-semibold">
                  {brand.supplier_rating.toFixed(1)} / 5.0
                </div>
                <div className="text-xs text-[#7A7151]">
                  Based on {brand.supplier_reviews ?? 0} reviews
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">
        {brand.bio && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
              About
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#0a2225]">
              {brand.bio}
            </p>
          </section>
        )}

        {collections.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                Collections
              </h2>
              <p className="text-[11px] text-[#8C8470]">
                {collections.length} {collections.length === 1 ? 'board' : 'boards'}
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {collections.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/brands/${brand.profile_id}/collections/${c.id}`)}
                  className="cursor-pointer rounded-2xl overflow-hidden border border-[#E5DFC6] bg-white hover:border-[#BFAD72] transition-colors"
                >
                  <div className="h-36 bg-[#F5F0E0]">
                    {c.cover_image_url ? (
                      <img
                        src={c.cover_image_url}
                        alt={c.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#F5F0E0] to-[#E5DFC6]" />
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-[#0a2225]">{c.title}</h3>
                    {c.description && (
                      <p className="text-xs text-[#4a4a4a] line-clamp-2">
                        {c.description}
                      </p>
                    )}
                    {c.tags && c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {c.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] uppercase tracking-wide border border-[#E5DFC6] rounded-full px-2 py-0.5 text-[#7A7151]"
                          >
                            {tag}
                          </span>
                        ))}
                        {c.tags.length > 3 && (
                          <span className="text-[10px] uppercase tracking-wide text-[#8C8470]">
                            +{c.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <TravelStoryboard
            title="Inspiration from this brand"
            subtitle="Ideas, destinations, and aesthetics from this brand's world, curated for Goldsainte travelers."
            maxItems={16}
            highlightTags={brand.categories ?? []}
          />
        </section>
      </main>
    </>
  );
}
