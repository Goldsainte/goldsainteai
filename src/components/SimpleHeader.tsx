import { SidebarTrigger } from "@/components/ui/sidebar";

export const SimpleHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <SidebarTrigger className="mr-4" />
        <div className="flex-1" />
      </div>
    </header>
  );
};
