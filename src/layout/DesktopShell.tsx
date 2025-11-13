import { Outlet } from "react-router-dom";
import LeftNav from "@/components/social/LeftNav";
import RightRail from "@/components/social/RightRail";
import { Panels } from "@/components/social/panels/Panels";

export default function DesktopShell() {
  return (
    <>
      {/* Mobile/Tablet: Just show content */}
      <div className="lg:hidden min-h-screen">
        <Outlet />
      </div>

      {/* Desktop: 3-column layout */}
      <div className="hidden lg:block">
        <div className="mx-auto max-w-[1280px] px-4">
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
    </>
  );
}
