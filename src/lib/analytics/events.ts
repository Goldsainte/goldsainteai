// Lightweight GA4 event helper. No-op until gtag/GA4 is present, so it's safe to
// call from anywhere (analytics activation is env-driven — see init.ts).
type Gtag = (command: string, ...args: unknown[]) => void;

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", name, params ?? {});
}
