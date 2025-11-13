import { useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePanelStore } from "@/stores/panelStore";
import SearchPanel from "./SearchPanel";
import NotificationsPanel from "./NotificationsPanel";
import MessagesPanel from "./MessagesPanel";

export function Panels() {
  const { open, type, close } = usePanelStore();

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()}>
      <SheetContent
        side="left"
        className="w-[397px] p-0 border-r border-border z-[60]"
      >
        {type === "search" && <SearchPanel />}
        {type === "notifications" && <NotificationsPanel />}
        {type === "messages" && <MessagesPanel />}
      </SheetContent>
    </Sheet>
  );
}
