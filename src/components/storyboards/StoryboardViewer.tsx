import { useStoryboardItems } from "@/hooks/useStoryboards";
import { cn } from "@/lib/utils";
import { Trash2, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoryboardViewerProps {
  storyboardId: string;
  canEdit?: boolean;
  onDeleteItem?: (itemId: string) => void;
}

export function StoryboardViewer({
  storyboardId,
  canEdit = false,
  onDeleteItem,
}: StoryboardViewerProps) {
  const { items, isLoading } = useStoryboardItems(storyboardId);

  if (isLoading) {
    return (
      <div className="h-40 rounded-2xl bg-muted/60 animate-pulse" />
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-muted-foreground/30 px-4 py-8 text-center text-[11px] text-muted-foreground">
        No items yet. Start building your storyboard.
      </div>
    );
  }

  return (
    <div className={cn("columns-2 gap-2 sm:columns-3 md:columns-4", "space-y-2")}>
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative overflow-hidden rounded-xl bg-muted break-inside-avoid"
        >
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.subtitle || item.title || "Storyboard item"}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            {canEdit && (
              <button
                onClick={() => onDeleteItem?.(item.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/90 text-destructive-foreground hover:bg-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>

          {(item.title || item.subtitle) && (
            <div className="absolute inset-x-2 bottom-2 rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur space-y-0.5">
              {item.title && <p className="font-medium">{item.title}</p>}
              {item.subtitle && <p className="text-[9px] text-white/80">{item.subtitle}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
