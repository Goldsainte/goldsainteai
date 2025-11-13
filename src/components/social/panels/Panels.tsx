import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePanelStore } from "@/stores/panelStore";
import SearchPanel from "./SearchPanel";
import NotificationsPanel from "./NotificationsPanel";
import MessagesPanel from "./MessagesPanel";

export function Panels() {
  const { open, type, close } = usePanelStore();
  
  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()}>
      <SheetContent side="left" className="w-[397px] p-0">
        {type === "search" && <SearchPanel />}
        {type === "notifications" && <NotificationsPanel />}
        {type === "messages" && <MessagesPanel />}
      </SheetContent>
    </Sheet>
  );
}
