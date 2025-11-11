import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, RotateCw } from 'lucide-react';

interface ExpediaWidgetCardProps {
  payload: {
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
    currency?: string;
    locale?: string;
  };
}

// Extend Window interface for Expedia widget
declare global {
  interface Window {
    EG?: {
      initWidgets?: () => void;
      init?: () => void;
    };
  }
}

export const ExpediaWidgetCard = ({ payload }: ExpediaWidgetCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetState, setWidgetState] = useState<'loading' | 'ready' | 'error' | 'redirect'>('loading');
  const [showReopen, setShowReopen] = useState(false);
  const initAttemptedRef = useRef(false);
  const destroyedRef = useRef(false);

  const destroyWidget = () => {
    if (destroyedRef.current) return;
    destroyedRef.current = true;
    
    const container = containerRef.current;
    if (container) {
      container.innerHTML = '';
    }
    
    console.log('🧹 Expedia widget destroyed');
  };

  const initWidget = () => {
    if (initAttemptedRef.current || destroyedRef.current) return;
    initAttemptedRef.current = true;
    destroyedRef.current = false;
    
    const container = containerRef.current;
    if (!container) {
      console.error('❌ Container not found for Expedia widget');
      setWidgetState('error');
      return;
    }

    // Check if container has non-zero dimensions
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn('⚠️ Container has zero dimensions, delaying init');
      setTimeout(initWidget, 100);
      return;
    }

    console.log('🎯 Initializing inline Expedia widget with payload:', payload);

    // Create widget container
    container.innerHTML = `
      <div class="eg-widget" 
        data-widget="search" 
        data-program="us-expedia" 
        data-lobs="stays,flights"
        data-network="pz"
        data-camref="1101l5ujJR"
        data-pubref="goldsainte ai inline"
        data-theme="light"
        ${payload.destination ? `data-destination="${payload.destination}"` : ''}
        ${payload.checkIn ? `data-checkin="${payload.checkIn}"` : ''}
        ${payload.checkOut ? `data-checkout="${payload.checkOut}"` : ''}
        ${payload.adults ? `data-adults="${payload.adults}"` : ''}
        style="width: 100%; min-height: 480px;">
      </div>
    `;

    // Load Expedia script if not already loaded
    const scriptId = 'expedia-widget-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://widgets.expedia.com/eg-widgets.js';
      script.async = true;
      document.body.appendChild(script);
    }

    // Initialize widget
    const initTimeout = setTimeout(() => {
      if (!destroyedRef.current) {
        console.error('⏱️ Widget initialization timeout');
        setWidgetState('error');
        console.log('🎯 [TELEMETRY] chat_expedia_widget_init_timeout');
      }
    }, 20000);

    const tryInit = () => {
      if (destroyedRef.current) return;
      
      if (window.EG?.initWidgets) {
        clearTimeout(initTimeout);
        try {
          window.EG.initWidgets();
          setWidgetState('ready');
          console.log('✅ Inline Expedia widget initialized');
          console.log('🎯 [TELEMETRY] chat_expedia_widget_init_success', {
            prefilled: {
              destination: !!payload.destination,
              checkIn: !!payload.checkIn,
              checkOut: !!payload.checkOut,
              adults: !!payload.adults
            }
          });
        } catch (error) {
          console.error('❌ Widget init error:', error);
          setWidgetState('error');
          console.log('🎯 [TELEMETRY] chat_expedia_widget_init_error');
        }
      } else if (window.EG?.init) {
        clearTimeout(initTimeout);
        try {
          window.EG.init();
          setWidgetState('ready');
          console.log('✅ Inline Expedia widget initialized (legacy)');
          console.log('🎯 [TELEMETRY] chat_expedia_widget_init_success');
        } catch (error) {
          console.error('❌ Widget init error:', error);
          setWidgetState('error');
        }
      }
    };

    // Try init immediately if script is loaded, otherwise wait for onload
    if (document.querySelector(`#${scriptId}[src]`)) {
      setTimeout(tryInit, 100);
    }
    
    script.onload = tryInit;
    script.onerror = () => {
      clearTimeout(initTimeout);
      console.error('❌ Failed to load Expedia widget script');
      setWidgetState('error');
      console.log('🎯 [TELEMETRY] chat_expedia_widget_script_load_failed');
    };
  };

  // Check for return from Expedia
  useEffect(() => {
    const returnedFromExpedia = sessionStorage.getItem('expediaRedirect') === '1';
    if (returnedFromExpedia) {
      sessionStorage.removeItem('expediaRedirect');
      setShowReopen(true);
      setWidgetState('redirect');
      console.log('🔙 Returned from Expedia, showing reopen option');
    } else {
      // Initialize widget on mount
      initWidget();
    }

    // Cleanup on unmount
    return () => {
      destroyWidget();
    };
  }, []);

  // Handle Expedia redirects
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (widgetState === 'ready') {
        sessionStorage.setItem('expediaRedirect', '1');
        console.log('🎯 [TELEMETRY] expedia_redirect_from_chat');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [widgetState]);

  const handleReopen = () => {
    setShowReopen(false);
    initAttemptedRef.current = false;
    destroyedRef.current = false;
    setWidgetState('loading');
    initWidget();
  };

  const handleOpenExpedia = () => {
    const params = new URLSearchParams({
      ...(payload.destination && { destination: payload.destination }),
      ...(payload.checkIn && { startDate: payload.checkIn }),
      ...(payload.checkOut && { endDate: payload.checkOut }),
      ...(payload.adults && { adults: payload.adults.toString() }),
    });
    
    sessionStorage.setItem('expediaRedirect', '1');
    const url = `https://www.expedia.com/Hotel-Search?${params.toString()}&camref=1101l5ujJR&pubref=goldsainte+ai+fallback`;
    window.open(url, '_blank');
    console.log('🎯 [TELEMETRY] chat_expedia_fallback_cta_click');
  };

  return (
    <div className="w-full max-w-[640px] mx-auto my-4 rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">Powered by Expedia</span>
          {payload.destination && (
            <span className="text-foreground">• {payload.destination}</span>
          )}
        </div>
        {widgetState === 'ready' && (
          <div className="text-xs text-muted-foreground">
            {payload.checkIn && payload.checkOut && (
              <span>{payload.checkIn} → {payload.checkOut}</span>
            )}
          </div>
        )}
      </div>

      {/* Widget Container */}
      {showReopen ? (
        <div className="p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Ready to search again?
          </p>
          <Button onClick={handleReopen} className="gap-2">
            <RotateCw className="h-4 w-4" />
            Reopen Search
          </Button>
        </div>
      ) : (
        <div className="relative" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div 
            ref={containerRef} 
            className="w-full"
            style={{ minHeight: widgetState === 'loading' ? '320px' : widgetState === 'ready' ? '480px' : 'auto' }}
          >
            {widgetState === 'loading' && (
              <div className="flex items-center justify-center p-12">
                <div className="space-y-3 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="text-sm text-muted-foreground">Loading search widget...</p>
                </div>
              </div>
            )}
            {widgetState === 'error' && (
              <div className="p-8 text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  The search widget couldn't load. It might be blocked by an ad or content blocker.
                </p>
                <Button onClick={handleOpenExpedia} variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open Expedia Search
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
