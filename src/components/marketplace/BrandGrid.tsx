import { BrandSummary, BrandCard } from "./BrandCard";

interface BrandGridProps {
  brands: BrandSummary[];
}

export function BrandGrid({ brands }: BrandGridProps) {
  if (!brands.length) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {brands.map((brand) => (
        <BrandCard key={brand.profile_id} brand={brand} />
      ))}
    </div>
  );
}
