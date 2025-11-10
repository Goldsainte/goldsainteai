import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

const CompactHeaderSearch = () => {
  const [open, setOpen] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [iframeActive, setIframeActive] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);
  const initAttemptedRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const iframeTimeoutRef = useRef<NodeJS.Timeout>();

  const getExpediaGlobal = () => {
    if (window.EG?.initWidgets) return { obj: window.EG, method: "initWidgets" };
    if (window.EG?.init) return { obj: window.EG, method: "init" };
    if (window.eg?.initWidgets) return { obj: window.eg, method: "initWidgets" };
    if (window.eg?.init) return { obj: window.eg, method: "init" };
    return null;
  };

  const getIframeUrl = () => {
    const baseUrl = "https://creator.expediagroup.com/products/widgets/search-widget";
    const params = new URLSearchParams({
      program: "us-expedia",
      lobs: "stays,flights",
      network: "pz",
      camref: "1101l5ujJR",
      pubref: "goldsainte ai",
      instance: Math.random().toString(36).substring(2, 15),
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const loadScript = () => {
    if (scriptLoading) return;
    
    const existingScript = document.querySelector('script[src*="eg-widgets.js"]');
    if (existingScript) {
      console.log("[ExpediaWidget] Script already in DOM");
      return;
    }

    console.log("[ExpediaWidget] Injecting official remote script");
    setScriptLoading(true);

    const script = document.createElement("script");
    script.src = "https://creator.expediagroup.com/products/widgets/assets/eg-widgets.js";
    script.async = true;

    script.onload = () => {
      console.log("[ExpediaWidget] Script loaded successfully");
      setScriptLoading(false);
      
      const expedia = getExpediaGlobal();
      if (expedia) {
        console.log(`[ExpediaWidget] EG global detected (${expedia.method})`);
        setWidgetReady(true);
      } else {
        console.log("[ExpediaWidget] Script loaded but EG global not found yet");
      }
    };

    script.onerror = () => {
      console.log("[ExpediaWidget] Script blocked – switching to iframe fallback");
      setScriptLoading(false);
      setIframeActive(true);
      
      iframeTimeoutRef.current = setTimeout(() => {
        console.log("[ExpediaWidget] Iframe timed out – showing CTA");
        setIframeActive(false);
        setShowFallback(true);
      }, 8000);
    };

    document.head.appendChild(script);
  };

  useEffect(() => {
    if (!open || !widgetReady || initAttemptedRef.current) return;

    console.log("[ExpediaWidget] Initializing widget");
    initAttemptedRef.current = true;

    const initWidget = () => {
      const expedia = getExpediaGlobal();
      if (!expedia) {
        console.log("[ExpediaWidget] EG global not found for init");
        return;
      }

      console.log(`[ExpediaWidget] Calling ${expedia.method}()`);
      
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (expedia.method === "initWidgets") {
            expedia.obj.initWidgets?.();
          } else {
            expedia.obj.init?.();
          }

          setTimeout(() => {
            const widget = document.querySelector(".eg-widget");
            if (!widget || !widget.children.length) {
              console.log("[ExpediaWidget] Widget didn't render, retrying...");
              retryTimeoutRef.current = setTimeout(() => {
                if (expedia.method === "initWidgets") {
                  expedia.obj.initWidgets?.();
                } else {
                  expedia.obj.init?.();
                }
              }, 500);
            } else {
              console.log("[ExpediaWidget] Widget rendered");
            }
          }, 100);
        }, 0);
      });
    };

    initWidget();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [open, widgetReady]);

  useEffect(() => {
    if (!open) {
      initAttemptedRef.current = false;
      setWidgetReady(false);
      setIframeActive(false);
      setShowFallback(false);
      if (iframeTimeoutRef.current) {
        clearTimeout(iframeTimeoutRef.current);
      }
      return;
    }

    console.log("[ExpediaWidget] Dialog opened");
    
    const expedia = getExpediaGlobal();
    if (expedia) {
      console.log(`[ExpediaWidget] EG global already available (${expedia.method})`);
      setWidgetReady(true);
      return;
    }

    loadScript();

    const fallbackTimer = setTimeout(() => {
      if (!widgetReady && !iframeActive) {
        console.log("[ExpediaWidget] Timeout – showing CTA");
        setShowFallback(true);
      }
    }, 10000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [open]);

  const handleIframeLoad = () => {
    console.log("[ExpediaWidget] Iframe loaded");
    if (iframeTimeoutRef.current) {
      clearTimeout(iframeTimeoutRef.current);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-sm font-medium hover:bg-accent"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Search Hotels & Flights
          </DialogTitle>
          <DialogDescription>
            Find and book your next trip with our travel search powered by Expedia
          </DialogDescription>
        </DialogHeader>

        <div className="w-full" style={{ minHeight: "600px" }}>
          {!widgetReady && !iframeActive && !showFallback && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {widgetReady && !iframeActive && (
            <div
              className="eg-widget"
              data-lobs="stays,flights"
              data-program="us-expedia"
              data-network="pz"
              data-camref="1101l5ujJR"
              data-pubref="goldsainte ai"
              style={{ width: "100%", minHeight: "600px" }}
            />
          )}

          {iframeActive && !showFallback && (
            <iframe
              src={getIframeUrl()}
              style={{
                width: "100%",
                minHeight: "700px",
                border: "none",
              }}
              title="Expedia Search Widget"
              onLoad={handleIframeLoad}
            />
          )}

          {showFallback && (
            <div className="text-center py-12 space-y-4">
              <p className="text-muted-foreground">
                The search widget couldn't load. It might be blocked by an ad or content blocker.
              </p>
              <p className="text-sm text-muted-foreground">
                You can still search directly on Expedia:
              </p>
              <Button asChild size="lg">
                <a
                  href="https://www.expedia.com/?pwaLob=wizard-hotel-pwa-v2&camref=1101l5ujJR&pubref=goldsainte%20ai"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Expedia Search
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { CompactHeaderSearch };
