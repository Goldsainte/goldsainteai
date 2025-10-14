import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { StoryInteractionCreator } from "./StoryInteractionCreator";

interface EffectsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (interaction: any) => void;
}

export const EffectsDrawer = ({ open, onOpenChange, onSave }: EffectsDrawerProps) => {
  const handleSave = (interaction: any) => {
    onSave(interaction);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] flex flex-col">
        <DrawerHeader>
          <DrawerTitle>Add Interactive Element</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto">
          <StoryInteractionCreator
            open={open}
            onOpenChange={onOpenChange}
            onSave={handleSave}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
