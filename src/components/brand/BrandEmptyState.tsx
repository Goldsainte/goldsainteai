import React from "react";
import emptyImage from "@/assets/brands/empty-state.webp";
import { Link } from "react-router-dom";

export const BrandEmptyState = () => {
  return (
    <div className="mx-auto mt-10 max-w-md text-center">
      <div className="mx-auto mb-6 overflow-hidden rounded-[24px] shadow-[0_16px_40px_rgba(10,34,37,0.12)]">
        <img
          src={emptyImage}
          alt="Luxury travel editorial empty state"
          className="h-56 w-full object-cover"
        loading="lazy"/>
      </div>

      <h3 className="font-secondary text-lg text-[#0a2225]">
        No brands available yet
      </h3>

      <p className="mt-2 text-sm text-[#6E6650]">
        Verified hotels, residencies and travel brands will appear here
        as they join Goldsainte's curated directory.
      </p>

      <Link
        to="/marketplace?tab=brands"
        className="mt-5 inline-block rounded-full bg-[#0a2225] px-5 py-2 text-sm font-medium text-white hover:bg-[#0d2d31]"
      >
        Browse all brands
      </Link>
    </div>
  );
};
