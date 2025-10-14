import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { MusicTrackSelector } from "./MusicTrackSelector";
import { Button } from "@/components/ui/button";

interface MusicSelectorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTrack: any;
  onTrackSelect: (track: any) => void;
}

export const MusicSelectorDrawer = ({
  open,
  onOpenChange,
  selectedTrack,
  onTrackSelect,
}: MusicSelectorDrawerProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
      <DrawerContent className="h-[75vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle>Add Music</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
          <MusicTrackSelector
            selectedTrack={selectedTrack}
            onTrackSelect={(track) => { 
              onTrackSelect(track); 
              if (track) onOpenChange(false); 
            }}
            compact
          />
        </div>
        <div className="border-t p-4 flex-shrink-0 bg-background">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
