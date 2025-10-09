import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { EnhancedSearchBar } from "@/components/EnhancedSearchBar";

export const CompactHeaderSearch = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="flex items-center gap-2 px-3 h-10 rounded-full border-border shadow-sm hover:shadow-md transition-all bg-background w-full max-w-[280px] md:max-w-3xl"
        aria-label="Open search"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">Search</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <EnhancedSearchBar />
        </DialogContent>
      </Dialog>
    </>
  );
};
