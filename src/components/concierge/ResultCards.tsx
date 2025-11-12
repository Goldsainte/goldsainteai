import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultCard {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  cta: {
    label: string;
    url: string;
  };
}

interface ResultCardsProps {
  section: string;
  cards: ResultCard[];
}

export function ResultCards({ section, cards }: ResultCardsProps) {
  if (!cards?.length) return null;

  return (
    <div className="my-4 space-y-2">
      <p className="text-sm font-medium text-muted-foreground px-1">{section}</p>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
        {cards.map((card) => (
          <div
            key={card.id}
            className="min-w-[280px] max-w-[280px] snap-start flex-shrink-0 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 space-y-3 hover:border-primary/30 transition-colors"
          >
            <div className="space-y-1">
              <h4 className="font-semibold text-sm line-clamp-2">{card.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{card.subtitle}</p>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-lg font-bold text-primary">{card.price}</span>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => window.open(card.cta.url, '_blank')}
              >
                {card.cta.label}
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
