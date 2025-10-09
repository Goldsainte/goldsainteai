import { PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Highlight {
  id: string;
  title: string;
  cover_image: string | null;
  emoji?: string;
}

interface StoryHighlightsProps {
  highlights?: Highlight[];
  isOwnProfile?: boolean;
  onAddNew?: () => void;
}

const StoryHighlights = ({ 
  highlights = [], 
  isOwnProfile = false,
  onAddNew 
}: StoryHighlightsProps) => {
  // Sample highlights for now
  const sampleHighlights = [
    { id: "1", title: "Bali", cover_image: null, emoji: "🇮🇩" },
    { id: "2", title: "Vietnam", cover_image: null, emoji: "🇻🇳" },
    { id: "3", title: "Thailand", cover_image: null, emoji: "🇹🇭" },
    { id: "4", title: "HK", cover_image: null, emoji: "🇭🇰" },
  ];

  const displayHighlights = highlights.length > 0 ? highlights : sampleHighlights;

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-4 py-2">
        {isOwnProfile && (
          <button
            onClick={onAddNew}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                <PlusCircle className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">New</span>
          </button>
        )}
        
        {displayHighlights.map((highlight) => (
          <button
            key={highlight.id}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-primary p-0.5">
                <Avatar className="w-full h-full">
                  <AvatarImage src={highlight.cover_image || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-2xl">
                    {highlight.emoji || highlight.title[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-xs max-w-[64px] truncate">
              {highlight.title}
            </span>
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default StoryHighlights;
