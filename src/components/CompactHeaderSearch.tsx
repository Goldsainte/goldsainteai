import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Widget integration disabled - replaced with direct Expedia affiliate link
// declare global {
//   interface Window {
//     EG?: {
//       initWidgets?: () => void;
//       init?: () => void;
//     };
//     eg?: {
//       initWidgets?: () => void;
//       init?: () => void;
//     };
//   }
// }

type ErrorType = 'csp_violation' | 'network_blocked' | 'script_load_failed' | 'init_failed' | 'iframe_blocked' | 'timeout' | 'unknown';

interface WidgetError {
  type: ErrorType;
  message: string;
  timestamp: number;
}

export interface CompactHeaderSearchProps {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  prefill?: {
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
  };
}

const CompactHeaderSearch = ({ 
  externalOpen, 
  onExternalOpenChange,
  prefill 
}: CompactHeaderSearchProps = {}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onExternalOpenChange || setInternalOpen;
  const [widgetReady, setWidgetReady] = useState(false);
  const [iframeActive, setIframeActive] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [error, setError] = useState<WidgetError | null>(null);
  const [containerVisible, setContainerVisible] = useState(false);
  const initAttemptedRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const iframeTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const errorListenerRef = useRef<((event: SecurityPolicyViolationEvent) => void) | null>(null);
  const mountedRef = useRef(false);

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
        script_loaded: widgetReady,
        container_visible: containerVisible,
        retry_count: retryCountRef.current,
      });
    }
  };

  const checkContainerVisibility = (): boolean => {
    if (!containerRef.current) return false;
    const rect = containerRef.current.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
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
    // Lowercase 'eg' disabled - widget integration removed
    // if (window.eg?.initWidgets) return { obj: window.eg, method: "initWidgets" };
    // if (window.eg?.init) return { obj: window.eg, method: "init" };
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
    
    // Add prefill parameters if available
    if (prefill?.destination) params.set('destination', prefill.destination);
    if (prefill?.checkIn) params.set('startDate', prefill.checkIn);
    if (prefill?.checkOut) params.set('endDate', prefill.checkOut);
    if (prefill?.adults) params.set('adults', prefill.adults.toString());
    if (prefill?.children) params.set('children', prefill.children.toString());
    
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

    // Check container visibility before init
    const visible = checkContainerVisibility();
    if (!visible) {
      console.log("[ExpediaWidget] Container not visible yet, waiting...");
      const checkInterval = setInterval(() => {
        if (checkContainerVisibility()) {
          setContainerVisible(true);
          clearInterval(checkInterval);
        }
      }, 100);
      
      setTimeout(() => clearInterval(checkInterval), 5000);
      return;
    }

    console.log("[ExpediaWidget] Initializing widget (attempt", retryCountRef.current + 1, ")");
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
              console.log("[ExpediaWidget] Widget didn't render");
              
              // Retry logic with exponential backoff
              if (retryCountRef.current < 2) {
                const backoffDelay = 800 * Math.pow(2, retryCountRef.current);
                retryCountRef.current += 1;
                console.log(`[ExpediaWidget] Retrying in ${backoffDelay}ms (attempt ${retryCountRef.current + 1}/3)`);
                
                retryTimeoutRef.current = setTimeout(() => {
                  initAttemptedRef.current = false;
                  if (expedia.method === "initWidgets") {
                    expedia.obj.initWidgets?.();
                  } else {
                    expedia.obj.init?.();
                  }
                }, backoffDelay);
              } else {
                logError('init_failed', 'Widget failed to render after 3 attempts');
                setShowFallback(true);
              }
            } else {
              console.log("[ExpediaWidget] Widget rendered successfully");
              retryCountRef.current = 0;
              
              // Log success telemetry
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'widget_init_success', {
                  load_method: 'script',
                  retry_count: retryCountRef.current,
                  has_prefill: !!prefill,
                });
              }
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
  }, [open, widgetReady, containerVisible]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!open) {
      initAttemptedRef.current = false;
      retryCountRef.current = 0;
      setWidgetReady(false);
      setIframeActive(false);
      setShowFallback(false);
      setError(null);
      setContainerVisible(false);
      
      if (iframeTimeoutRef.current) {
        clearTimeout(iframeTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      // Remove CSP error listener
      if (errorListenerRef.current) {
        document.removeEventListener('securitypolicyviolation', errorListenerRef.current as any);
        errorListenerRef.current = null;
      }
      
      // Call destroy if available
      const expedia = getExpediaGlobal();
      if (expedia && (expedia.obj as any).destroy) {
        console.log("[ExpediaWidget] Destroying widget instance");
        (expedia.obj as any).destroy();
      }
      return;
    }

    console.log("[ExpediaWidget] Dialog opened", prefill ? 'with prefill' : 'without prefill');
    
    // Log prefill telemetry
    if (prefill && (window as any).gtag) {
      (window as any).gtag('event', 'widget_prefill_applied', {
        has_destination: !!prefill.destination,
        has_check_in: !!prefill.checkIn,
        has_check_out: !!prefill.checkOut,
        has_adults: !!prefill.adults,
        has_children: !!prefill.children,
      });
    }
    
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

    // Check container visibility
    setTimeout(() => {
      const visible = checkContainerVisibility();
      console.log("[ExpediaWidget] Container visible:", visible);
      setContainerVisible(visible);
    }, 100);

    const fallbackTimer = setTimeout(() => {
      if (!widgetReady && !iframeActive) {
        console.log("[ExpediaWidget] 20s init timeout - switching to iframe fallback");
        setIframeActive(true);
        // Start a secondary timeout to show CTA if iframe also fails
        iframeTimeoutRef.current = setTimeout(() => {
          logError('timeout', 'Iframe fallback timeout (8s)');
          setIframeActive(false);
          setShowFallback(true);
        }, 8000);
      }
    }, 20000);

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
      (window as any).gtag('event', 'widget_init_success', {
        load_method: 'iframe',
        has_prefill: !!prefill,
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

  const destroyExpediaWidget = () => {
    const expedia = getExpediaGlobal();
    if (expedia && (expedia.obj as any).destroy) {
      console.log("[ExpediaWidget] Destroying widget instance");
      (expedia.obj as any).destroy();
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    if (iframeTimeoutRef.current) {
      clearTimeout(iframeTimeoutRef.current);
    }
    if (errorListenerRef.current) {
      document.removeEventListener('securitypolicyviolation', errorListenerRef.current as any);
      errorListenerRef.current = null;
    }
  };

  const handleExpediaRedirect = (url: string) => {
    console.log("[ExpediaWidget] Preparing Expedia redirect");
    
    // Telemetry
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'expedia_redirect_click', {
        from_prefill: !!prefill,
      });
    }
    
    sessionStorage.setItem('expediaRedirect', '1');
    destroyExpediaWidget();
    setOpen(false);
    window.location.href = url;
  };

  // Check if returning from Expedia and prevent auto-open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const cameFromExpedia =
      document.referrer.includes('expedia.com') ||
      sessionStorage.getItem('expediaRedirect') === '1';

    if (cameFromExpedia) {
      console.log("[ExpediaWidget] Returned from Expedia, suppressing auto-init");
      sessionStorage.removeItem('expediaRedirect');
      setOpen(false);
      destroyExpediaWidget();
      mountedRef.current = true;
      
      // Telemetry
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'return_from_expedia');
      }
      return;
    }
    
    mountedRef.current = true;
  }, []);

  // Handle browser back/forward cache restoration
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        console.log("[ExpediaWidget] Page restored from bfcache, resetting state");
        destroyExpediaWidget();
        setOpen(false);
        setWidgetReady(false);
        setIframeActive(false);
        setShowFallback(false);
        setError(null);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="relative rounded-full border border-accent bg-accent backdrop-blur text-center justify-center text-primary hover:bg-accent/90 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all min-h-[44px] min-w-[44px] h-[40px] sm:h-[44px] lg:h-[48px] px-10 sm:px-12 w-full max-w-[700px] font-medium"
          aria-label="Search flights and hotels with Goldsainte and Expedia"
        >
          <span className="truncate text-[15px] lg:text-[16px] leading-none">
            {isMobile ? "Search flights & hotels" : "Search flights and hotels with Goldsainte × Expedia"}
          </span>
          <Search className="absolute right-3 h-4 w-4 text-primary pointer-events-none" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="w-[min(95svw,760px)] max-w-[95svw] sm:max-w-[760px] min-w-0 max-h-[88vh] overflow-hidden bg-gradient-to-br from-white via-luxury-ivory to-white border-2 border-accent shadow-2xl"
        aria-describedby="expedia-widget-description"
      >
        <DialogHeader className="border-b border-accent/30 pb-4 space-y-2">
          <DialogTitle className="font-secondary text-[20px] sm:text-[24px] leading-tight text-primary">
            Search Hotels & Flights
          </DialogTitle>
          <DialogDescription id="expedia-widget-description" className="text-sm text-primary/70">
            Powered by Goldsainte × Expedia
          </DialogDescription>
        </DialogHeader>

        <div className="max-w-[640px] w-full mx-auto overflow-y-auto max-h-[calc(88vh-120px)]">
          <div ref={containerRef} className="w-full overflow-visible min-w-0 p-4" style={{
            minHeight: !widgetReady && !iframeActive && !showFallback 
              ? "320px"
              : "auto"
          }}>
          {!widgetReady && !iframeActive && !showFallback && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
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
              {...(prefill?.destination && { 'data-destination': prefill.destination })}
              {...(prefill?.checkIn && { 'data-checkin': prefill.checkIn })}
              {...(prefill?.checkOut && { 'data-checkout': prefill.checkOut })}
              {...(prefill?.adults && { 'data-adults': prefill.adults.toString() })}
              {...(prefill?.children && { 'data-children': prefill.children.toString() })}
              style={{ width: "100%" }}
            />
          )}

          {iframeActive && !showFallback && (
            <iframe
              src={getIframeUrl()}
              style={{
                height: "560px",
                width: "100%",
                border: "none",
              }}
              title="Expedia Search Widget"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}


          {showFallback && (
            <div className="text-center py-12 space-y-4 bg-luxury-ivory/50 rounded-xl p-6">
              <p className="text-primary/80">
                {error?.type === 'csp_violation' 
                  ? 'Content Security Policy blocked the widget. Please contact support.'
                  : error?.type === 'network_blocked'
                  ? 'Network request blocked. Please check your ad blocker or firewall settings.'
                  : error?.type === 'iframe_blocked'
                  ? 'Widget embed blocked. This may be due to X-Frame-Options restrictions.'
                  : 'The search widget couldn\'t load. It might be blocked by an ad or content blocker.'}
              </p>
              <p className="text-sm text-primary/70">
                You can still search directly on Expedia:
              </p>
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-secondary"
                onClick={() => handleExpediaRedirect(
                  "https://www.expedia.com/?pwaLob=wizard-hotel-pwa-v2&camref=1101l5ujJR&pubref=goldsainte%20ai"
                )}
              >
                Open Expedia Search
              </Button>
            </div>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { CompactHeaderSearch };

