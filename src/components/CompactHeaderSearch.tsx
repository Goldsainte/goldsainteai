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
  const [widgetReady, setWidgetReady] = useState(false);

  // Check if Expedia widget script is loaded
  useEffect(() => {
    const checkWidget = setInterval(() => {
      if (window.EG && typeof window.EG.initWidgets === 'function') {
        setWidgetReady(true);
        clearInterval(checkWidget);
      }
    }, 100);

    // Cleanup after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkWidget);
    }, 10000);

    return () => {
      clearInterval(checkWidget);
      clearTimeout(timeout);
    };
  }, []);

  // Initialize widget when dialog opens and script is ready
  useEffect(() => {
    if (open && widgetReady) {
      // Give the DOM time to render
      const timer = setTimeout(() => {
        if (window.EG && typeof window.EG.initWidgets === 'function') {
          try {
            window.EG.initWidgets();
            console.log('Expedia widget initialized');
          } catch (error) {
            console.error('Failed to initialize Expedia widget:', error);
          }
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open, widgetReady]);

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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search Hotels & Flights</DialogTitle>
          </DialogHeader>
          <div className="w-full min-h-[500px] p-4">
            {!widgetReady && (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading search widget...</p>
                </div>
              </div>
            )}
            <div 
              id="expedia-search-widget"
              className="eg-widget" 
              data-widget="search" 
              data-program="us-expedia" 
              data-lobs="stays,flights" 
              data-network="pz" 
              data-camref="1101l5ujJR" 
              data-pubref=""
              style={{ minHeight: widgetReady ? '400px' : '0' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
