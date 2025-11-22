import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartnershipTagging } from "./PartnershipTagging";
import { PeopleTagSelector } from "./PeopleTagSelector";
import { Users, Package, UserPlus } from "lucide-react";

interface TaggingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnershipBrandId: string | null;
  onPartnershipChange: (brandId: string | null) => void;
  taggedPackageIds: string[];
  onPackageTagsChange: (packageIds: string[]) => void;
  taggedUserIds: string[];
  onPeopleTagsChange: (userIds: string[]) => void;
}

export const TaggingDrawer = ({
  open,
  onOpenChange,
  partnershipBrandId,
  onPartnershipChange,
  taggedPackageIds,
  onPackageTagsChange,
  taggedUserIds,
  onPeopleTagsChange,
}: TaggingDrawerProps) => {
  const [tempBrandId, setTempBrandId] = useState(partnershipBrandId);
  const [tempPackageIds, setTempPackageIds] = useState(taggedPackageIds);
  const [tempUserIds, setTempUserIds] = useState(taggedUserIds);

  useEffect(() => {
    setTempBrandId(partnershipBrandId);
    setTempPackageIds(taggedPackageIds);
    setTempUserIds(taggedUserIds);
  }, [partnershipBrandId, taggedPackageIds, taggedUserIds]);

  const handleSave = () => {
    onPartnershipChange(tempBrandId);
    onPackageTagsChange(tempPackageIds);
    onPeopleTagsChange(tempUserIds);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
      <DrawerContent className="h-[75vh] flex flex-col">
        <DrawerHeader>
          <DrawerTitle>Tag People & Packages</DrawerTitle>
        </DrawerHeader>
        <Tabs defaultValue="people" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 grid w-auto grid-cols-3">
            <TabsTrigger value="people" className="gap-2">
              <UserPlus className="w-4 h-4" />
              People
            </TabsTrigger>
            <TabsTrigger value="brands" className="gap-2">
              <Users className="w-4 h-4" />
              Brands
            </TabsTrigger>
            <TabsTrigger value="packages" className="gap-2">
              <Package className="w-4 h-4" />
              Packages
            </TabsTrigger>
          </TabsList>
          <TabsContent value="people" className="flex-1 overflow-y-auto px-4 mt-4">
            <PeopleTagSelector
              selectedUserIds={tempUserIds}
              onSelectionChange={setTempUserIds}
            />
          </TabsContent>
          <TabsContent value="brands" className="flex-1 overflow-y-auto px-4 mt-4">
            <PartnershipTagging
              onPartnershipChange={setTempBrandId}
              currentBrandId={tempBrandId}
            />
          </TabsContent>
        </Tabs>
        <div className="border-t p-4 flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
