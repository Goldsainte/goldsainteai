import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search } from "lucide-react";

// Type declaration for Expedia widget
declare global {
  interface Window {
    EG?: {
      initWidgets: () => void;
    };
  }
}

export const CompactHeaderSearch = () => {
  const [open, setOpen] = useState(false);

  // Initialize Expedia widget when dialog opens
  useEffect(() => {
    if (open && window.EG && typeof window.EG.initWidgets === 'function') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        window.EG.initWidgets();
      }, 100);
    }
  }, [open]);

  return (
    <>
      <Button
        variant="outline"
        className="flex items-center gap-2 px-3 h-10 rounded-full border-2 border-secondary shadow-sm hover:shadow-md hover:bg-[#BFAD72] hover:border-[#bfad72] transition-all bg-background w-full max-w-[280px] md:max-w-3xl group"
        aria-label="Open search"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 text-secondary group-hover:text-white transition-colors" />
        <span className="text-sm font-medium group-hover:text-white transition-colors">Search</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Search Hotels & Flights</DialogTitle>
          </DialogHeader>
          <div className="w-full min-h-[500px]">
            <div 
              className="eg-widget" 
              data-widget="search" 
              data-program="us-expedia" 
              data-lobs="stays,flights" 
              data-network="pz" 
              data-camref="1101l5ujJR" 
              data-pubref=""
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
