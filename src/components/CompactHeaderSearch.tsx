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
        className="flex items-center gap-2 px-3 h-10 rounded-full border-2 border-secondary shadow-sm hover:shadow-md hover:bg-secondary/10 hover:border-[#bfad72] transition-all bg-background w-full max-w-[280px] md:max-w-3xl"
        aria-label="Open search"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 text-secondary" />
        <span className="text-sm font-medium">Search</span>
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
