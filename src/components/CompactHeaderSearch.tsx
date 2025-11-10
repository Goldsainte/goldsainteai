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

type ErrorType = 'csp_violation' | 'network_blocked' | 'script_load_failed' | 'init_failed' | 'iframe_blocked' | 'timeout' | 'unknown';

interface WidgetError {
  type: ErrorType;
  message: string;
  timestamp: number;
}

const CompactHeaderSearch = () => {
  const [open, setOpen] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [iframeActive, setIframeActive] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [error, setError] = useState<WidgetError | null>(null);
  const initAttemptedRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const iframeTimeoutRef = useRef<NodeJS.Timeout>();
  const errorListenerRef = useRef<((event: SecurityPolicyViolationEvent) => void) | null>(null);

  const logError = (type: ErrorType, message: string, details?: any) => {
    const errorObj: WidgetError = { type, message, timestamp: Date.now() };
    setError(errorObj);
    console.error(`[ExpediaWidget:${type}]`, message, details || '');
    
    // Telemetry - could send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'expedia_widget_error', {
        error_type: type,
        error_message: message,
        user_agent: navigator.userAgent,
      });
    }
  };

  const detectAdBlocker = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    try {
      const testRequest = await fetch('https://creator.expediagroup.com/products/widgets/assets/eg-widgets.js', {
        method: 'HEAD',
        mode: 'no-cors',
      });
      return false;
    } catch (e) {
      logError('network_blocked', 'Ad blocker or network restriction detected', e);
      return true;
    }
  };

  const getExpediaGlobal = () => {
    if (typeof window === 'undefined') return null;
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

  const loadScript = async () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      logError('unknown', 'Client-only guard: window or document not available');
      return;
    }

    if (scriptLoading) return;
    
    const existingScript = document.querySelector('script[src*="eg-widgets.js"]');
    if (existingScript) {
      console.log("[ExpediaWidget] Script already in DOM");
      return;
    }

    // Check for ad blocker first
    const isBlocked = await detectAdBlocker();
    if (isBlocked) {
      console.log("[ExpediaWidget] Ad blocker detected, skipping script load");
      setIframeActive(true);
      
      iframeTimeoutRef.current = setTimeout(() => {
        logError('timeout', 'Iframe load timeout (8s) - likely blocked');
        setIframeActive(false);
        setShowFallback(true);
      }, 8000);
      return;
    }

    console.log("[ExpediaWidget] Injecting official remote script");
    setScriptLoading(true);

    const script = document.createElement("script");
    script.src = "https://creator.expediagroup.com/products/widgets/assets/eg-widgets.js";
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      console.log("[ExpediaWidget] Script loaded successfully");
      setScriptLoading(false);
      
      const expedia = getExpediaGlobal();
      if (expedia) {
        console.log(`[ExpediaWidget] EG global detected (${expedia.method})`);
        setWidgetReady(true);
      } else {
        logError('init_failed', 'Script loaded but EG global not found');
      }
    };

    script.onerror = (e) => {
      logError('script_load_failed', 'Script load error - likely blocked by CSP or network', e);
      setScriptLoading(false);
      setIframeActive(true);
      
      iframeTimeoutRef.current = setTimeout(() => {
        logError('timeout', 'Iframe fallback timeout (8s)');
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
    if (typeof window === 'undefined') return;

    if (!open) {
      initAttemptedRef.current = false;
      setWidgetReady(false);
      setIframeActive(false);
      setShowFallback(false);
      setError(null);
      
      if (iframeTimeoutRef.current) {
        clearTimeout(iframeTimeoutRef.current);
      }
      
      // Remove CSP error listener
      if (errorListenerRef.current) {
        document.removeEventListener('securitypolicyviolation', errorListenerRef.current as any);
        errorListenerRef.current = null;
      }
      return;
    }

    console.log("[ExpediaWidget] Dialog opened");
    
    // Add CSP violation listener
    const cspListener = (e: SecurityPolicyViolationEvent) => {
      if (e.blockedURI?.includes('expedia')) {
        logError('csp_violation', `CSP blocked: ${e.violatedDirective} - ${e.blockedURI}`, e);
        setShowFallback(true);
      }
    };
    errorListenerRef.current = cspListener;
    document.addEventListener('securitypolicyviolation', cspListener as any);
    
    // Add global error listener
    const errorHandler = (event: ErrorEvent) => {
      if (event.message?.toLowerCase().includes('expedia')) {
        logError('unknown', 'Global error related to Expedia widget', event);
      }
    };
    window.addEventListener('error', errorHandler);
    
    const expedia = getExpediaGlobal();
    if (expedia) {
      console.log(`[ExpediaWidget] EG global already available (${expedia.method})`);
      setWidgetReady(true);
      return;
    }

    loadScript();

    const fallbackTimer = setTimeout(() => {
      if (!widgetReady && !iframeActive) {
        logError('timeout', 'Widget initialization timeout (10s)');
        setShowFallback(true);
      }
    }, 10000);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('error', errorHandler);
      if (errorListenerRef.current) {
        document.removeEventListener('securitypolicyviolation', errorListenerRef.current as any);
      }
    };
  }, [open]);

  const handleIframeLoad = () => {
    console.log("[ExpediaWidget] Iframe loaded successfully");
    if (iframeTimeoutRef.current) {
      clearTimeout(iframeTimeoutRef.current);
    }
    // Log success telemetry
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'expedia_widget_success', {
        load_method: 'iframe',
      });
    }
  };

  const handleIframeError = () => {
    logError('iframe_blocked', 'Iframe failed to load - likely blocked by CSP or X-Frame-Options');
    if (iframeTimeoutRef.current) {
      clearTimeout(iframeTimeoutRef.current);
    }
    setIframeActive(false);
    setShowFallback(true);
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
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}

          {showFallback && (
            <div className="text-center py-12 space-y-4">
              <p className="text-muted-foreground">
                {error?.type === 'csp_violation' 
                  ? 'Content Security Policy blocked the widget. Please contact support.'
                  : error?.type === 'network_blocked'
                  ? 'Network request blocked. Please check your ad blocker or firewall settings.'
                  : error?.type === 'iframe_blocked'
                  ? 'Widget embed blocked. This may be due to X-Frame-Options restrictions.'
                  : 'The search widget couldn\'t load. It might be blocked by an ad or content blocker.'}
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
              {error && (
                <p className="text-xs text-muted-foreground/60 mt-4">
                  Error: {error.type} - {error.message}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { CompactHeaderSearch };
