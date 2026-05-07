import { useState } from "react";
import { Link } from "react-router-dom";
import { Lightbulb, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function StoryboardExplainerCard() {
  const [open, setOpen] = useState(() => {
    return localStorage.getItem("gs-storyboard-explainer-dismissed") !== "true";
  });

  const handleToggle = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      localStorage.setItem("gs-storyboard-explainer-dismissed", "true");
    }
  };

  return (
    <Collapsible open={open} onOpenChange={handleToggle}>
      <div className="rounded-2xl border border-[#E5DFC6] bg-white/90 overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[#f7f3ea]/50 transition-colors">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[#BFAD72]" />
            <span className="text-xs font-semibold tracking-wide text-[#0a2225]">
              Storyboard vs Post a Trip — what's the difference?
            </span>
          </div>
          {open ? (
            <ChevronUp className="h-4 w-4 text-[#8D8D8D]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#8D8D8D]" />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-5 pb-5">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Storyboard column */}
              <div className="rounded-xl border border-[#E5DFC6] bg-[#f7f3ea]/60 p-4 space-y-2">
                <span className="inline-block rounded-full bg-[#BFAD72]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#BFAD72]">
                  Storyboard
                </span>
                <p className="text-xs leading-relaxed text-[#4a4a4a]">
                  Your personal mood board. Save images, browse inspiration, and
                  visualize your dream experience.{" "}
                  <span className="font-medium text-[#0a2225]">
                    No commitment, no deadlines. Just vibes.
                  </span>
                </p>
              </div>

              {/* Post a Trip column */}
              <div className="rounded-xl border border-[#0c4d47]/20 bg-[#0c4d47]/5 p-4 space-y-2">
                <span className="inline-block rounded-full bg-[#0c4d47]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#0c4d47]">
                  Post a Trip
                </span>
                <p className="text-xs leading-relaxed text-[#4a4a4a]">
                  Ready to go? When you post a trip, your storyboard becomes a
                  brief that creators and agents compete to bring to life on the
                  marketplace.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <Link
                to="/post-trip"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0c4d47] hover:text-[#073331] transition-colors"
              >
                Explore Travel Marketplace
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
