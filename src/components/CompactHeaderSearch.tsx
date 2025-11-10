import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, ExternalLink } from "lucide-react";

// Type declaration for Expedia widget - support multiple global variants
declare global {
  interface Window {
    EG?: {
      initWidgets?: () => void;
      init?: () => void;
    };
    eg?: {
      initWidgets?: () => void;
      init?: () => void;
    };
  }
}

export const CompactHeaderSearch = () => {
  const [open, setOpen] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);
  const initAttemptedRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Detect if Expedia global is available (support multiple variants)
  const getExpediaGlobal = () => {
    if (window.EG?.initWidgets) return { global: window.EG, method: 'initWidgets' };
    if (window.EG?.init) return { global: window.EG, method: 'init' };
    if (window.eg?.initWidgets) return { global: window.eg, method: 'initWidgets' };
    if (window.eg?.init) return { global: window.eg, method: 'init' };
    return null;
  };

  // Dynamically load script if not found
  const loadScript = () => {
    if (scriptLoading) return;
    
    const existingScript = document.querySelector('.eg-widgets-script');
    if (existingScript) {
      console.log('[ExpediaWidget] Script tag exists, waiting for load...');
      return;
    }

    console.log('[ExpediaWidget] Injecting script dynamically...');
    setScriptLoading(true);
    
    const script = document.createElement('script');
    script.className = 'eg-widgets-script';
    script.src = 'https://creator.expediagroup.com/products/widgets/assets/eg-widgets.js';
    script.defer = true;
    
    script.onload = () => {
      console.log('[ExpediaWidget] Script loaded successfully');
      setScriptLoading(false);
      const expedia = getExpediaGlobal();
      if (expedia) {
        console.log('[ExpediaWidget] Global detected:', expedia.method);
        setWidgetReady(true);
      }
    };
    
    script.onerror = () => {
      console.error('[ExpediaWidget] Script failed to load');
      setScriptLoading(false);
      setShowFallback(true);
    };
    
    document.head.appendChild(script);
  };

  // Check if Expedia widget script is loaded
  useEffect(() => {
    console.log('[ExpediaWidget] Starting detection...');
    
    const checkWidget = setInterval(() => {
      const expedia = getExpediaGlobal();
      if (expedia) {
        console.log('[ExpediaWidget] Global detected:', expedia.method);
        setWidgetReady(true);
        clearInterval(checkWidget);
      }
    }, 100);

    // After 3 seconds, try loading script if not found
    const loadTimeout = setTimeout(() => {
      if (!getExpediaGlobal()) {
        console.log('[ExpediaWidget] Global not found after 3s, attempting script load...');
        loadScript();
      }
    }, 3000);

    // After 10 seconds, show fallback
    const fallbackTimeout = setTimeout(() => {
      if (!widgetReady) {
        console.warn('[ExpediaWidget] Timeout - showing fallback');
        setShowFallback(true);
      }
      clearInterval(checkWidget);
    }, 10000);

    return () => {
      clearInterval(checkWidget);
      clearTimeout(loadTimeout);
      clearTimeout(fallbackTimeout);
    };
  }, [widgetReady]);

  // Initialize widget when dialog opens and script is ready
  useEffect(() => {
    if (!open) {
      initAttemptedRef.current = false;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      return;
    }

    if (open && widgetReady && !initAttemptedRef.current) {
      initAttemptedRef.current = true;
      
      // Use requestAnimationFrame + setTimeout to ensure DOM is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          const expedia = getExpediaGlobal();
          if (expedia) {
            try {
              console.log('[ExpediaWidget] Initializing with', expedia.method);
              (expedia.global as any)[expedia.method]();
              console.log('[ExpediaWidget] Init called successfully');
              
              // Retry once more after 500ms to ensure it rendered
              retryTimeoutRef.current = setTimeout(() => {
                const container = document.getElementById('expedia-search-widget');
                if (container && container.children.length === 0) {
                  console.log('[ExpediaWidget] Retry init - no children rendered');
                  try {
                    (expedia.global as any)[expedia.method]();
                  } catch (err) {
                    console.error('[ExpediaWidget] Retry init failed:', err);
                  }
                }
              }, 500);
            } catch (error) {
              console.error('[ExpediaWidget] Init failed:', error);
            }
          }
        }, 0);
      });
    }

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
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
            <DialogDescription>
              Search and book hotels and flights with our partner Expedia
            </DialogDescription>
          </DialogHeader>
          <div className="w-full min-h-[600px] p-4">
            {!widgetReady && !showFallback && (
              <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading search widget...</p>
                  {scriptLoading && (
                    <p className="text-xs text-muted-foreground mt-2">Connecting to Expedia...</p>
                  )}
                </div>
              </div>
            )}
            
            {showFallback && (
              <div className="flex flex-col items-center justify-center h-[500px] gap-4">
                <div className="text-center max-w-md">
                  <p className="text-muted-foreground mb-2">
                    The search widget couldn't load. It might be blocked by an ad or content blocker.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    You can still search directly on Expedia:
                  </p>
                  <Button
                    onClick={() => {
                      const expediaUrl = `https://www.expedia.com/?camref=1101l5ujJR&pubref=goldsainte%20ai`;
                      window.open(expediaUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Expedia Search
                  </Button>
                </div>
              </div>
            )}
            
            <div 
              id="expedia-search-widget"
              className="eg-widget w-full" 
              data-widget="search" 
              data-program="us-expedia" 
              data-lobs="stays,flights" 
              data-network="pz" 
              data-camref="1101l5ujJR" 
              data-pubref="goldsainte ai"
              style={{ 
                minHeight: widgetReady ? '600px' : '0',
                width: '100%',
                display: widgetReady && !showFallback ? 'block' : 'none'
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
