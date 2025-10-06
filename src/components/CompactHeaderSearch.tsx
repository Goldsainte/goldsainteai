import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { EnhancedSearchBar } from "@/components/EnhancedSearchBar";

// CompactHeaderSearch
// Refactored to use the single source-of-truth EnhancedSearchBar so the
// search flow is consistent (mobile-first: choose type, then relevant fields).
export const CompactHeaderSearch = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Mobile trigger */}
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex md:hidden items-center gap-2 px-3 h-10 rounded-full border-border shadow-sm hover:shadow-md transition-all bg-background w-full max-w-[280px]"
          aria-label="Open search"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Search</span>
        </Button>
      </DialogTrigger>

      {/* Desktop trigger */}
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="hidden md:flex items-center gap-2 px-4 h-12 rounded-full border-border shadow-sm hover:shadow-md transition-all bg-background w-full max-w-3xl"
          aria-label="Open search"
        >
          <span className="text-sm">Search</span>
          <div className="ml-auto p-2 bg-primary rounded-full flex-shrink-0">
            <Search className="h-3 w-3 text-primary-foreground" />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-0">
        {/* Render the unified search experience */}
        <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
          <EnhancedSearchBar />
        </div>
      </DialogContent>
    </Dialog>
  );
};
