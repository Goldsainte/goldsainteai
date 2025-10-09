import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  Video, 
  Grid3X3, 
  Circle, 
  Sparkles, 
  Radio, 
  Wand2, 
  Heart, 
  MessageCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateContentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: string) => void;
}

const CreateContentSheet = ({ open, onOpenChange, onSelectType }: CreateContentSheetProps) => {
  const navigate = useNavigate();

  const options = [
    { 
      id: "reel", 
      label: "Reel", 
      icon: Video, 
      description: "Short-form video content",
      available: true
    },
    { 
      id: "post", 
      label: "Post", 
      icon: Grid3X3, 
      description: "Share photos and videos",
      available: true
    },
    { 
      id: "story", 
      label: "Story", 
      icon: Circle, 
      description: "Share a moment that disappears in 24h",
      available: false
    },
    { 
      id: "story-highlight", 
      label: "Story highlight", 
      icon: Sparkles, 
      description: "Create a collection of stories",
      available: false
    },
    { 
      id: "live", 
      label: "Live", 
      icon: Radio, 
      description: "Go live and connect in real-time",
      available: false
    },
    { 
      id: "ai", 
      label: "AI", 
      icon: Wand2, 
      description: "AI-generated content ideas",
      available: false
    },
    { 
      id: "fundraiser", 
      label: "Fundraiser", 
      icon: Heart, 
      description: "Raise money for a cause",
      available: false
    },
    { 
      id: "channel", 
      label: "Channel", 
      icon: MessageCircle, 
      description: "Broadcast to your followers",
      available: false
    }
  ];

  const handleSelect = (optionId: string, available: boolean) => {
    if (!available) return;
    onSelectType(optionId);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[80vh] rounded-t-3xl"
      >
        <SheetHeader className="pb-6">
          <SheetTitle className="text-center text-xl">Create</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-1 pb-6">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id, option.available)}
                disabled={!option.available}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl transition-colors text-left",
                  option.available 
                    ? "hover:bg-muted/50 active:bg-muted cursor-pointer" 
                    : "opacity-40 cursor-not-allowed"
                )}
              >
                <div className="flex-shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{option.label}</div>
                  {!option.available && (
                    <div className="text-xs text-muted-foreground">
                      Coming soon
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CreateContentSheet;
