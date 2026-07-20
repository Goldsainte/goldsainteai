import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CollectionSidebarProps {
  brandName: string;
  startingPriceLabel?: string;
  onRequestTrip: () => void;
  className?: string;
}

export function CollectionSidebar({
  brandName,
  startingPriceLabel,
  onRequestTrip,
  className,
}: CollectionSidebarProps) {
  return (
    <aside className={cn("space-y-4", className)}>
      {/* Pricing & CTA card */}
      <div className="rounded-[20px] border border-[#E5DFC6] bg-[#FDFBF5] px-4 py-4">
        <div className="space-y-3">
          {startingPriceLabel && (
            <div>
              <p className="text-[12.5px] uppercase tracking-[0.16em] text-[#A4987C]">
                Starting from
              </p>
              <p className="mt-1 text-base font-medium text-[#0a2225]">
                {startingPriceLabel}
              </p>
            </div>
          )}

          <div>
            <p className="text-[12.5px] text-[#8C8470]">
              Hosted by <span className="font-medium text-[#0a2225]">{brandName}</span>
            </p>
          </div>

          <Button
            onClick={onRequestTrip}
            className="w-full rounded-full bg-[#0a2225] px-4 py-2.5 text-[13px] font-medium text-[#FDFBF5] hover:bg-[#123338]"
          >
            Request a trip like this
          </Button>
        </div>

        <p className="mt-3 text-[12.5px] text-[#8A806B]">
          You'll be matched with creators & travel designers aligned with this
          brand's aesthetic.
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-[20px] border border-[#E5DFC6] bg-[#FDFBF5] px-4 py-4">
        <h3 className="text-sm font-semibold text-[#0a2225]">
          How this works
        </h3>
        <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[12px] text-[#6E6650]">
          <li>Share who's traveling and preferred dates.</li>
          <li>
            Goldsainte matches you with creators & travel designers who work in
            this brand's world.
          </li>
          <li>
            You review tailored proposals, refine details in chat and book
            securely through Stripe.
          </li>
        </ol>
      </div>

      {/* Trust & safety */}
      <div className="rounded-[20px] border border-[#E5DFC6] bg-[#FDFBF5] px-4 py-4">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.16em] text-[#A4987C]">
          Trust & safety
        </p>
        <ul className="mt-2 space-y-1 text-[12px] text-[#6E6650]">
          <li>✓ Verified brand partners & identity-checked professionals</li>
          <li>✓ Secure payments with campaign protection</li>
          <li>✓ Messaging and approvals stay inside Goldsainte</li>
        </ul>
      </div>
    </aside>
  );
}
