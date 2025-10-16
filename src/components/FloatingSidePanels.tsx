import { Sparkles, Gift } from "lucide-react";

export function FloatingSidePanels() {
  return (
    <>
      {/* Left Panel */}
      <div className="hidden xl:block fixed left-0 top-1/2 -translate-y-1/2 w-40 max-h-[80vh] bg-background border-r border-border shadow-lg z-[999]">
        <a
          href="/deals"
          className="flex flex-col items-center justify-center gap-3 p-6 h-full hover:bg-accent/5 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">Special Travel Deals</p>
            <p className="text-xs text-muted-foreground">Save up to 30%</p>
          </div>
          <span className="text-xs font-medium text-primary group-hover:underline">
            See deals →
          </span>
        </a>
      </div>

      {/* Right Panel */}
      <div className="hidden xl:block fixed right-0 top-1/2 -translate-y-1/2 w-40 max-h-[80vh] bg-background border-l border-border shadow-lg z-[999]">
        <a
          href="/creator-dashboard"
          className="flex flex-col items-center justify-center gap-3 p-6 h-full hover:bg-accent/5 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">Premium Features</p>
            <p className="text-xs text-muted-foreground">Try Creator Tools</p>
          </div>
          <span className="text-xs font-medium text-primary group-hover:underline">
            Learn more →
          </span>
        </a>
      </div>
    </>
  );
}
