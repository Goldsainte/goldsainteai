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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] flex flex-col">
        <DrawerHeader>
          <DrawerTitle>Add Music</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <MusicTrackSelector
            selectedTrack={selectedTrack}
            onTrackSelect={(track) => { onTrackSelect(track); onOpenChange(false); }}
            compact
          />
        </div>
        <div className="border-t p-4">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Done
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
