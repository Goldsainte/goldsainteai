import { useState } from "react";
import { useStoryboards, useStoryboardItems } from "@/hooks/useStoryboards";
import { StoryboardViewer } from "./StoryboardViewer";
import { TravelStoryboard } from "./TravelStoryboard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface StoryboardCreatorProps {
  tripId?: string;
  ownerRole: "creator" | "agent" | "traveler";
}

export function StoryboardCreator({ tripId, ownerRole }: StoryboardCreatorProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStoryboardId, setSelectedStoryboardId] = useState<string | null>(null);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState("");
  const [itemCaption, setItemCaption] = useState("");

  const { storyboards, createStoryboard } = useStoryboards(tripId);
  const { addItem, deleteItem } = useStoryboardItems(selectedStoryboardId || undefined);

  const handleCreateStoryboard = () => {
    // Map agent role to creator for storyboard system
    const mappedRole = ownerRole === "agent" ? "creator" : ownerRole === "creator" ? "creator" : "traveler";
    
    createStoryboard({
      role: mappedRole,
      title,
      description,
      is_public: false,
    });
    setOpen(false);
    setTitle("");
    setDescription("");
  };

  const handleSelectMedia = (imageUrl: string) => {
    setSelectedMediaUrl(imageUrl);
    setAddItemOpen(true);
  };

  const handleAddItem = () => {
    if (!selectedStoryboardId || !selectedMediaUrl) return;
    
    addItem({
      storyboard_id: selectedStoryboardId,
      item_type: "image",
      title: itemCaption || "Untitled",
      image_url: selectedMediaUrl,
    });
    
    setAddItemOpen(false);
    setSelectedMediaUrl("");
    setItemCaption("");
  };

  return (
    <div className="space-y-6">
      {/* Create new storyboard */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Trip Storyboard</h3>
          <p className="text-[11px] text-muted-foreground">
            Build a Pinterest-like board for this trip
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-3 w-3" />
              New Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Storyboard</DialogTitle>
              <DialogDescription>
                Create a visual board to collect inspiration for this trip.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Maldives Honeymoon"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overwater villas, sunset cruises, and spa days"
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateStoryboard} className="w-full">
                Create Storyboard
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Storyboard selector */}
      {storyboards && storyboards.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {storyboards.map((board) => (
            <button
              key={board.id}
              onClick={() => setSelectedStoryboardId(board.id)}
              className={cn(
                "flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
                selectedStoryboardId === board.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {board.title || "Untitled Board"}
            </button>
          ))}
        </div>
      )}

      {/* Current storyboard viewer */}
      {selectedStoryboardId && (
        <StoryboardViewer
          storyboardId={selectedStoryboardId}
          canEdit={true}
          onDeleteItem={deleteItem}
        />
      )}

      {/* Media library for adding items */}
      {selectedStoryboardId && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-[11px] font-medium text-muted-foreground">
              Click any image below to add to your storyboard
            </p>
          </div>
          <TravelStoryboard
            maxItems={100}
            onImageClick={(img) => handleSelectMedia(img.url)}
          />
        </div>
      )}

      {/* Add item dialog */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Storyboard</DialogTitle>
            <DialogDescription>
              Add a caption or details for this image.
            </DialogDescription>
          </DialogHeader>
          {selectedMediaUrl && (
            <img
              src={selectedMediaUrl}
              alt="Selected"
              className="w-full h-48 object-cover rounded-lg"
            />
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={itemCaption}
                onChange={(e) => setItemCaption(e.target.value)}
                placeholder="Morning coffee with ocean views"
              />
            </div>
            <Button onClick={handleAddItem} className="w-full">
              Add to Storyboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
