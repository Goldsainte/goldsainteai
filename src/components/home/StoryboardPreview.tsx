// src/components/home/StoryboardPreview.tsx
import { TravelStoryboard } from "@/components/storyboards/TravelStoryboard";

export function StoryboardPreview() {
  return (
    <section className="bg-[#f6f3ea] px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[#0a2225] md:text-lg">
              Storyboard your next escape
            </h2>
            <p className="mt-1 max-w-xl text-xs text-[#4a4a4a] md:text-sm">
              Every creator and agent on Goldsainte gets a travel storyboard—a
              Pinterest-inspired space to pin imagery, moods, and moments before
              a trip ever goes live.
            </p>
          </div>
          <p className="text-[11px] text-[#8D8D8D] md:text-right">
            Coming to your profile, creator pages, and Goldsainte Creator Lab.
          </p>
        </div>

        <TravelStoryboard
          maxItems={18}
          title=""
          subtitle=""
          highlightTags={["honeymoon", "europe", "island"]}
        />
      </div>
    </section>
  );
}
