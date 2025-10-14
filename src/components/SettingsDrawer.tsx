import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibility: 'public' | 'close_friends';
  onVisibilityChange: (visibility: 'public' | 'close_friends') => void;
}

export const SettingsDrawer = ({
  open,
  onOpenChange,
  visibility,
  onVisibilityChange,
}: SettingsDrawerProps) => {
  const [tempVisibility, setTempVisibility] = useState(visibility);

  useEffect(() => {
    setTempVisibility(visibility);
  }, [visibility]);

  const handleSave = () => {
    onVisibilityChange(tempVisibility);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Post Settings
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visibility">Who can see this?</Label>
            <Select value={tempVisibility} onValueChange={(v) => setTempVisibility(v as 'public' | 'close_friends')}>
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="close_friends">Close Friends Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
