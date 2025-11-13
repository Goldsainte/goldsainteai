import { Outlet } from "react-router-dom";
import LeftNav from "@/components/social/LeftNav";
import RightRail from "@/components/social/RightRail";
import { Panels } from "@/components/social/panels/Panels";

export default function DesktopShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto" style={{ maxWidth: 1500 }}>
        <div className="grid" style={{ gridTemplateColumns: "244px 1fr 320px" }}>
          {/* Left nav */}
          <aside className="hidden xl:block border-r border-border min-h-screen sticky top-0">
            <LeftNav />
          </aside>

          {/* Center feed */}
          <main className="min-h-screen flex justify-center">
            <div className="w-full max-w-[630px]">
              <Outlet />
            </div>
          </main>

          {/* Right suggestions */}
          <aside className="hidden lg:block pt-8 pl-6">
            <RightRail />
          </aside>
        </div>
      </div>

      {/* Slide-out panels anchored to the left */}
      <Panels />
    </div>
  );
}
