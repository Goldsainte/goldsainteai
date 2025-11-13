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
      <div className="hidden lg:block min-h-screen bg-background">
        <div className="mx-auto grid grid-cols-[244px_minmax(560px,700px)_350px] gap-6 px-6">
          {/* Left nav */}
          <aside className="sticky top-0 h-screen py-6">
            <LeftNav />
          </aside>

          {/* Center feed (fluid 560-700px) */}
          <main className="py-6">
            <Outlet />
          </main>

          {/* Right rail (suggested) */}
          <aside className="sticky top-0 h-screen py-6">
            <RightRail />
          </aside>
        </div>

        {/* Left slide-out panels overlay (search/notifications/messages) */}
        <Panels />
      </div>
    </>
  );
}
