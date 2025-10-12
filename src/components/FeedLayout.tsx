import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { FeedSidebar } from "./FeedSidebar";

interface FeedLayoutProps {
  children: ReactNode;
}

export function FeedLayout({ children }: FeedLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        {/* Left Navigation Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <AppSidebar />
        </div>

        {/* Main Content Area - Centered feed with max width */}
        <div className="flex-1 flex justify-center">
          <main className="w-full lg:max-w-[630px]">
            {children}
          </main>
        </div>

        {/* Right Suggestions Sidebar - Hidden on mobile/tablet */}
        <div className="hidden xl:block xl:w-[380px]">
          <FeedSidebar />
        </div>
      </div>
    </SidebarProvider>
  );
}
