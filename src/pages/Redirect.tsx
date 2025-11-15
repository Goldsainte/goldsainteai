import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// Simple redirect page to safely open external reservation links from within the preview iframe
export default function Redirect() {
  const [params] = useSearchParams();

  useEffect(() => {
    const toParam = params.get("to");
    if (!toParam) return;

    try {
      const decoded = atob(decodeURIComponent(toParam));
      // Validate protocol for safety (allow https/http/mail/phone)
      const target = new URL(decoded);
      const protocolAllowed = ['https:', 'http:', 'mailto:', 'tel:'].includes(target.protocol);
      if (!protocolAllowed) return;

      // Replace current tab with the target URL
      window.location.replace(decoded);
      // Fallback attempt for Safari COOP edge cases
      setTimeout(() => {
        try {
          window.location.href = decoded;
        } catch (error) {
          console.warn('Failed to update window location during redirect fallback', error);
        }
      }, 300);
    } catch (error) {
      console.warn('Failed to process redirect target', error);
    }
  }, [params]);
  const to = params.get("to");
  let decodedHref: string | null = null;
  let hostAllowedForManual = false;
  try {
    if (to) {
      decodedHref = atob(decodeURIComponent(to));
      const tgt = new URL(decodedHref);
      hostAllowedForManual = ['https:', 'http:', 'mailto:', 'tel:'].includes(tgt.protocol);
    }
  } catch (error) {
    console.warn('Failed to decode redirect parameter', error);
  }
  
  return (
    <main className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">Opening reservation page…</p>
        {decodedHref && hostAllowedForManual && (
          <a href={decodedHref} target="_self" rel="noopener noreferrer" className="text-sm text-primary underline">
            Tap here if it doesn’t open
          </a>
        )}
      </div>
    </main>
  );
}
