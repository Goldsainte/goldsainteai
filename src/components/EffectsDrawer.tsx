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
    <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
      <DrawerContent className="h-[75vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle>Add Interactive Element</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto min-h-0 px-1">
          <StoryInteractionCreator
            open={open}
            onOpenChange={onOpenChange}
            onSave={handleSave}
            embedded
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
