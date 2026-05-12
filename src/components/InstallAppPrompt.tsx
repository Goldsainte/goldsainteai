import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "install_prompt_dismissed";
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone;
    if (isStandalone) return;

    const ua = navigator.userAgent;
    const isIPhone = /iPhone|iPad|iPod/.test(ua);
    const isMacWithTouch = /Macintosh/.test(ua) && 'ontouchend' in document;
    const isCriOS = /CriOS/.test(ua); // Chrome on iOS
    const isFxiOS = /FxiOS/.test(ua); // Firefox on iOS
    const ios = isIPhone || isMacWithTouch || isCriOS || isFxiOS;
    setIsIOS(ios);

    const dismissed = localStorage.getItem(DISMISS_KEY);
    const recentlyDismissed =
      dismissed && Date.now() - new Date(dismissed).getTime() < FOURTEEN_DAYS_MS;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!recentlyDismissed) setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (ios && !recentlyDismissed) {
      const t = window.setTimeout(() => setShowBanner(true), 8000);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Manual trigger from the Footer "Install App" link
  useEffect(() => {
    const showHandler = () => setShowBanner(true);
    window.addEventListener("show-install-prompt", showHandler);
    return () => window.removeEventListener("show-install-prompt", showHandler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] p-4 shadow-lg sm:left-auto sm:right-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0c4d47] text-[#f7f3ea]">
          {isIOS ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-secondary text-base text-[#0a2225]">Install Goldsainte</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#6E6650]">
            {isIOS
              ? <>Tap <span className="inline-flex items-center gap-1 rounded bg-[#E5DFC6]/50 px-1.5 py-0.5 text-[10px] font-medium text-[#0c4d47]"><Share className="h-3 w-3" /> Share</span> at the bottom of Safari, then scroll down and tap <span className="font-medium text-[#0a2225]">Add to Home Screen</span>.</>
              : "Add Goldsainte to your home screen for instant access to trips and bookings."}
          </p>
          {!isIOS && deferredPrompt && (
            <Button
              onClick={handleInstall}
              className="mt-3 h-8 rounded-full bg-[#0c4d47] px-4 text-xs text-[#f7f3ea] hover:bg-[#0a3e39]"
            >
              Install Now
            </Button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[#9A9384] hover:bg-[#E5DFC6]/40 hover:text-[#0a2225]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}