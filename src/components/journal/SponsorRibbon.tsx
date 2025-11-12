import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SponsorRibbonProps {
  sponsorName?: string;
  sponsorLogo?: string;
  sponsorUrl?: string;
}

export function SponsorRibbon({
  sponsorName = "Our Partner",
  sponsorLogo,
  sponsorUrl,
}: SponsorRibbonProps) {
  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-primary/20 py-4 px-6 mb-8">
      <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          {sponsorLogo && (
            <img
              src={sponsorLogo}
              alt={sponsorName}
              className="h-8 w-auto object-contain"
            />
          )}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Sponsored Content
            </p>
            <p className="text-sm font-medium text-foreground">
              In partnership with {sponsorName}
            </p>
          </div>
        </div>

        {sponsorUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(sponsorUrl, "_blank")}
            className="gap-2 bg-background"
          >
            Learn More
            <ExternalLink className="w-3 h-3" />
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3 max-w-2xl mx-auto">
        This article contains sponsored content. Our editorial team maintains
        full editorial control and only partners with brands we believe in.
      </p>
    </div>
  );
}
