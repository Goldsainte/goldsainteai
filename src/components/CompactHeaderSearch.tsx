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
                (window as any).gtag('event', 'expedia_widget_success', {
                  load_method: 'script',
                  retry_count: retryCountRef.current,
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
          className="relative h-10 sm:h-11 lg:h-12 rounded-full border border-[#D8C89B] bg-white/90 backdrop-blur pl-3 sm:pl-4 pr-10 sm:pr-12 text-[14px] sm:text-[15px] lg:text-[16px] text-left justify-start text-gray-500 hover:bg-white/95 hover:border-[#C5B88A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4B44]/30 focus-visible:ring-offset-2 transition-all"
          style={{ width: 'clamp(220px, 28vw, 520px)' }}
          aria-label="Search hotels and flights"
        >
          <span>Search hotels & flights...</span>
          <Search className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0E4B44]" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(70vw,760px)] max-w-[92vw] min-w-[320px] max-h-[88vh] overflow-auto p-4 sm:p-6 rounded-2xl flex flex-col justify-start">
        <DialogHeader>
          <DialogTitle className="text-[18px] sm:text-[20px] font-semibold">
            Search Hotels & Flights
          </DialogTitle>
          <DialogDescription>
            Find and book your next trip with our travel search powered by Expedia
          </DialogDescription>
        </DialogHeader>

        <div className="max-w-[640px] w-full mx-auto">
          <div ref={containerRef} className="w-full overflow-visible" style={{ 
            minHeight: !widgetReady && !iframeActive && !showFallback 
              ? "320px"
              : "auto"
          }}>
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
              <Button 
                size="lg"
                onClick={() => handleExpediaRedirect(
                  "https://www.expedia.com/?pwaLob=wizard-hotel-pwa-v2&camref=1101l5ujJR&pubref=goldsainte%20ai"
                )}
              >
                Open Expedia Search
              </Button>
export { CompactHeaderSearch };
