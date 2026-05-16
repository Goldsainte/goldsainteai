import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandHero } from "@/components/brand/BrandHero";
import { BrandGallery } from "@/components/brand/BrandGallery";
import { BrandProfileSidebar } from "@/components/brand/BrandProfileSidebar";
import { BrandRegionsSection } from "@/components/brand/BrandRegionsSection";
import { toast } from "sonner";
import { SaveToStoryboardModal } from "@/components/discovery/SaveToStoryboardModal";

interface BrandProfile {
  id: string;
  owner_user_id: string;
  brand_name: string;
  brand_type?: string | null;
  tagline?: string | null;
  bio?: string | null;
  cover_image_url?: string | null;
  logo_url?: string | null;
  gallery_urls?: string[] | null;
  regions?: string[] | null;
  cities?: string[] | null;
  style_tags?: string[] | null;
  website?: string | null;
  average_rating?: number | null;
  review_count?: number | null;
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
        // Fetch directly from brand_profiles for all fields
        const { data: brandData, error: brandError } = await supabase
          .from("brand_profiles")
          .select(`
            id,
            owner_user_id,
            brand_name,
            brand_type,
            tagline,
            bio,
            cover_image_url,
            logo_url,
            gallery_urls,
            regions,
            cities,
            style_tags,
            website,
            average_rating,
            review_count
          `)
          .eq("id", profileId)
          .maybeSingle();

        if (brandError) {
          console.error("Error fetching brand:", brandError);
          setBrand(null);
          setLoading(false);
          return;
        }

        if (brandData) {
          setBrand(brandData as BrandProfile);

          // Load collections for this brand
          const { data: collData } = await supabase
            .from("brand_collections")
            .select("id, title, description, cover_image_url, tags, is_published, sort_order")
            .eq("brand_profile_id", brandData.id)
            .eq("is_published", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });

          if (collData) {
            setCollections(collData as BrandCollection[]);
          }
        } else {
          setBrand(null);
        }
      } catch (err) {
        console.error("Error loading brand:", err);
        setBrand(null);
      }

      setLoading(false);
    };

    void loadBrand();
  }, [profileId]);

  const handleRequestTrip = () => {
    navigate(`/post-trip?brandId=${brand?.id}&brandName=${encodeURIComponent(brand?.brand_name || "")}`);
  };

  const [saveOpen, setSaveOpen] = useState(false);
  const handleAddToStoryboard = () => setSaveOpen(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF9F0]">
        <div className="animate-pulse">
          <div className="h-64 md:h-80 bg-[#E5DFC6]" />
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="h-8 w-64 rounded bg-[#E5DFC6]" />
            <div className="mt-4 h-4 w-96 rounded bg-[#E5DFC6]" />
          </div>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-[#FDF9F0]">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <div className="mx-auto max-w-md">
            <h1 className="font-secondary text-2xl text-[#0a2225]">Brand not found</h1>
            <p className="mt-2 text-sm text-[#6B7280]">
              We couldn't find this brand. It may have been removed or is still being onboarded.
            </p>
            <Button
              onClick={() => navigate("/marketplace?tab=brands")}
              className="mt-6 bg-[#0c4d47] hover:bg-[#0a3d39] text-white"
            >
              Browse all brands
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{brand.brand_name} · Goldsainte Brands</title>
        <meta name="description" content={brand.tagline || brand.bio || `Discover ${brand.brand_name} on Goldsainte`} />
      </Helmet>

      <div className="min-h-screen bg-[#FDF9F0]">
        {/* Back button */}
        <div className="sticky top-0 z-10 bg-[#FDF9F0]/80 backdrop-blur-sm border-b border-[#E5DFC6]/40">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm text-[#4a4a4a] hover:text-[#0a2225] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>

        {/* Hero */}
        <BrandHero
          name={brand.brand_name}
          tagline={brand.tagline}
          coverImageUrl={brand.cover_image_url}
          logoUrl={brand.logo_url}
          brandType={brand.brand_type}
          regions={brand.regions}
          styleTags={brand.style_tags}
          averageRating={brand.average_rating}
          reviewCount={brand.review_count}
        />

        {/* Main content - two column layout */}
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* Left column - main content */}
            <div className="space-y-8">
              {/* About section */}
              {brand.bio && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                    About {brand.brand_name}
                  </h2>
                  <p className="mt-3 text-[#0a2225] leading-relaxed whitespace-pre-line">
                    {brand.bio}
                  </p>
                </section>
              )}

              {/* Gallery */}
              {brand.gallery_urls && brand.gallery_urls.length > 0 && (
                <BrandGallery
                  images={brand.gallery_urls}
                  brandName={brand.brand_name}
                />
              )}

              {/* Collections */}
              {collections.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                      Collections
                    </h2>
                    <span className="text-xs text-[#8C8470]">
                      {collections.length} {collections.length === 1 ? "collection" : "collections"}
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {collections.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => navigate(`/brands/${brand.id}/collections/${c.id}`)}
                        className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E5DFC6] bg-white transition-all hover:border-[#C7B892] hover:shadow-lg"
                      >
                        <div className="aspect-[16/10] overflow-hidden bg-[#F5F0E0]">
                          {c.cover_image_url ? (
                            <img
                              src={c.cover_image_url}
                              alt={c.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"/>
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-[#F5F0E0] to-[#E5DFC6]" />
                          )}
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-medium text-[#0a2225] group-hover:text-[#0c4d47] transition-colors">
                            {c.title}
                          </h3>
                          {c.description && (
                            <p className="text-sm text-[#6B7280] line-clamp-2">
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
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Operating Regions */}
              <BrandRegionsSection
                regions={brand.regions}
                cities={brand.cities}
              />

              {/* Style Tags */}
              {brand.style_tags && brand.style_tags.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                    Specialties
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {brand.style_tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#C7B892]/20 border border-[#C7B892]/30 px-4 py-1.5 text-sm text-[#0a2225]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right column - sticky sidebar */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <BrandProfileSidebar
                brandName={brand.brand_name}
                averageRating={brand.average_rating}
                reviewCount={brand.review_count}
                website={brand.website}
                onRequestTrip={handleRequestTrip}
                onAddToStoryboard={handleAddToStoryboard}
              />
            </div>
          </div>
        </div>
      </div>
      {brand && (
        <SaveToStoryboardModal
          open={saveOpen}
          onOpenChange={setSaveOpen}
          imageUrl={brand.hero_image_url || brand.logo_url || ""}
          title={brand.brand_name}
          subtitle={brand.tagline || undefined}
          sourceType="brand"
          sourceId={brand.id}
        />
      )}
    </>
  );
}
