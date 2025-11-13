import { Outlet } from "react-router-dom";
import LeftNav from "@/components/social/LeftNav";
import RightRail from "@/components/social/RightRail";
import { Panels } from "@/components/social/panels/Panels";

export default function DesktopShell() {
  return (
    <div className="hidden lg:block">
      {/* Constrain shell to IG-like width: 244 + 24 + 630 + 24 + 320 = 1242px */}
      <div className="mx-auto max-w-[1280px] px-4">
        {/* 3-column grid with fixed tracks so center never shrinks */}
        <div className="grid grid-cols-[244px_630px_320px] gap-6">
          {/* Left nav */}
          <aside className="min-h-screen sticky top-0">
            <LeftNav />
          </aside>

          {/* Center feed (fixed 630px) */}
          <main className="min-h-screen">
            <Outlet />
          </main>

          {/* Right rail (suggested) */}
          <aside className="min-h-screen sticky top-0">
            <RightRail />
          </aside>
        </div>
      </div>

      {/* Left slide-out panels overlay (search/notifications/messages) */}
      <Panels />
    </div>
  );
}
