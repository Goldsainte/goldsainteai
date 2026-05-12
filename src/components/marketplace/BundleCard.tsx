import { Link } from "react-router-dom";
import { Layers } from "lucide-react";

interface BundleCardProps {
  bundle: {
    id: string;
    title: string;
    description?: string | null;
    cover_image_url?: string | null;
    price: number;
    currency: string;
    trip_id?: string | null;
    guide_ids?: string[] | null;
    creator?: { full_name?: string | null; username?: string | null } | null;
  };
}

export function BundleCard({ bundle }: BundleCardProps) {
  const guideCount = bundle.guide_ids?.length || 0;
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: bundle.currency || "USD",
    maximumFractionDigits: 0,
  });
  return (
    <Link
      to={`/bundle/${bundle.id}`}
      className="group block overflow-hidden rounded-2xl border border-[#E5DFC6] bg-white transition-all hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F7F3EA]">
        {bundle.cover_image_url ? (
          <img
            src={bundle.cover_image_url}
            alt={bundle.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#C7A962]">
            <Layers className="h-12 w-12" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-[#0c4d47] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
          Bundle
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-secondary text-lg leading-tight text-[#0a2225] line-clamp-2">
          {bundle.title}
        </h3>
        <p className="mt-1 text-xs text-[#6B7280]">
          {bundle.trip_id ? "1 trip" : "0 trips"} · {guideCount} guide{guideCount === 1 ? "" : "s"}
          {bundle.creator?.full_name ? ` · by ${bundle.creator.full_name}` : ""}
        </p>
        <p className="mt-3 font-semibold text-[#0a2225]">{fmt.format(Number(bundle.price))}</p>
      </div>
    </Link>
  );
}