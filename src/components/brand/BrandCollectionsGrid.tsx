import * as React from "react";
import { BrandCollectionCard } from "./BrandCollectionCard";

type BrandCollection = {
  id: string;
  title: string;
  subtitle?: string;
  cover_main_image_url: string;
  cover_secondary_image_url?: string;
  cover_tertiary_image_url?: string;
  tags?: string[];
  saved_count?: number;
  starting_price_label?: string;
};

type BrandCollectionsGridProps = {
  brandId: string;
  collections: BrandCollection[];
};

export const BrandCollectionsGrid: React.FC<BrandCollectionsGridProps> = ({
  brandId,
  collections,
}) => {
  if (!collections.length) {
    return null;
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-secondary text-xl text-[#0a2225]">
            Collections by this brand
          </h2>
          <p className="mt-1 text-[13px] text-[#6E6650]">
            Curated journeys, ready to be tailored to you.
          </p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <BrandCollectionCard
            key={collection.id}
            brandId={brandId}
            collectionId={collection.id}
            title={collection.title}
            subtitle={collection.subtitle}
            coverMainImageUrl={collection.cover_main_image_url}
            coverSecondaryImageUrl={collection.cover_secondary_image_url}
            coverTertiaryImageUrl={collection.cover_tertiary_image_url}
            tags={collection.tags}
            savedCount={collection.saved_count}
            startingPriceLabel={collection.starting_price_label}
          />
        ))}
      </div>
    </section>
  );
};
