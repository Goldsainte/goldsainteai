import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export const SimpleHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <SidebarTrigger className="mr-4" />
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="rounded-full">
            Log in
          </Button>
          <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            Sign up for free
          </Button>
        </div>
      </div>
    </header>
  );
};
