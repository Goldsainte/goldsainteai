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
    <div
      className={`fixed inset-0 z-50 transition-opacity ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Dim overlay */}
      <div
        onClick={close}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      {/* Drawer - 397px wide, slides from left at 244px offset (width of left nav) */}
      <div
        className={`absolute left-[244px] top-0 h-screen w-[397px] bg-card border-r border-border shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {type === "search" && <SearchPanel />}
        {type === "notifications" && <NotificationsPanel />}
        {type === "messages" && <MessagesPanel />}
      </div>
    </div>
  );
}
