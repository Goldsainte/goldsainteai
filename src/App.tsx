import { useEffect, useState } from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmDialogHost } from "@/components/ui/confirm-dialog";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

import { SkipNavigation } from "@/components/SkipNavigation";
import { OnboardingTour } from "@/components/OnboardingTour";
import { WelcomeModal } from "@/components/WelcomeModal";
import { OnboardingWelcomeModal } from "@/components/OnboardingWelcomeModal";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ExpediaModalProvider } from "@/contexts/ExpediaModalContext";

import { usePresence } from "@/hooks/usePresence";
import { useUserChange } from "@/hooks/useUserChange";
import { ensureCSRFToken } from "@/lib/security/csrf";
import { AppRoutes } from "@/routes/AppRoutes";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";
import { useAffiliateRefCapture } from "@/hooks/useAffiliateRef";
import { RouteSectionBoundary } from "@/routes/RouteSectionBoundary";
import GoldsainteIntro from "@/components/GoldsainteIntro";



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const HIDE_HEADER_PAGES = new Set([
  "/auth",
  "/login",
  "/signup",
  // Legacy social feed - disabled
  // "/travel-feed",
  // "/journeys",
  "/travel-settings",
]);



const HIDE_FOOTER_PREFIXES = [
  "/auth",
  "/login",
  "/signup",
  "/reset-password",
  "/onboarding",
  "/ai-agent-setup",
  // Legacy social feed - disabled
  // "/travel-feed",
  // "/journeys",
  // "/search",
  // "/trending",
  
  "/travel-settings",
  "/creator-dashboard",
  "/your-activity",
  "/activity-logs",
  "/customer-verification",
  "/emergency-contacts",
  "/agent-performance",
  "/agent-deals",
  "/email-preview",
  // Legacy Instagram demo - disabled
  // "/instagram-api",
  // "/instagram-callback",
  "/admin/upload-email-assets",
  "/admin/upload-apple-music-key",
  "/admin/upload-apple-signin-key",
  "/not-found",
];

function shouldHideForPath(pathname: string, patterns: Iterable<string>) {
  for (const pattern of patterns) {
    if (pathname === pattern || pathname.startsWith(pattern)) {
      return true;
    }
  }
  return false;
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  usePresence();
  useUserChange();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    void ensureCSRFToken();
  }, []);

  // Removed: welcomeDismissed navigation handler was causing unexpected redirects to home

  // Disabled auto-show of WelcomeModal on homepage to show new content immediately
  // useEffect(() => {
  //   const hasSeenWelcome = localStorage.getItem("goldsainte-welcome-seen");
  //   if (!hasSeenWelcome && location.pathname === "/") {
  //     setShowWelcomeModal(true);
  //   }
  // }, [location.pathname]);

  useEffect(() => {
    const badge = document.querySelector(
      ".lovable-badge, [data-lovable-badge], iframe[src*=\"lovable\"]",
    );
    if (badge instanceof HTMLElement) {
      // Legacy paths disabled - always show badge now
      badge.style.display = "block";
    }
  }, [location.pathname]);

  useEffect(() => {
    const hashParams = new URLSearchParams(location.hash.startsWith("#") ? location.hash.slice(1) : location.hash);
    const queryParams = new URLSearchParams(location.search);
    const hashType = hashParams.get("type");
    const queryType = queryParams.get("type");
    const isRecoveryHash = hashType === "recovery";
    const isRecoveryTokenHash = Boolean(queryParams.get("token_hash")) && (queryType === "recovery" || isRecoveryHash);
    const isRecoveryCodeFallback = Boolean(queryParams.get("code")) && (queryType === "recovery" || location.pathname === "/" || location.pathname === "/auth/callback");

    if (location.pathname === "/reset-password") {
      return;
    }

    if (isRecoveryHash || isRecoveryTokenHash || isRecoveryCodeFallback) {
      navigate(
        {
          pathname: "/reset-password",
          search: location.search,
          hash: location.hash,
        },
        { replace: true }
      );
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  const hideHeader = shouldHideForPath(location.pathname, HIDE_HEADER_PAGES);
  const hideFooter = shouldHideForPath(location.pathname, HIDE_FOOTER_PREFIXES);
  useAffiliateRefCapture();
  return (
    <div className="min-h-screen flex-1 flex flex-col w-full max-w-full">
      <SkipNavigation />
      <OnboardingWelcomeModal />
      <WelcomeModal open={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} isFirstVisit />
      <OnboardingTour />
      {hideHeader ? null : <Header />}
      <main id="main-content" className="flex-1 flex flex-col" tabIndex={-1}>
        <RouteSectionBoundary section="app">
          <AppRoutes />
        </RouteSectionBoundary>
      </main>
      {hideFooter ? null : <Footer />}
    </div>
  );
}

export default function App() {
  const [introComplete, setIntroComplete] = useState(() => {
    if (typeof window === "undefined") return true;
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;
    if (!isStandalone) return true;
    return sessionStorage.getItem("goldsainte-intro-seen") === "true";
  });

  const handleIntroComplete = () => {
    sessionStorage.setItem("goldsainte-intro-seen", "true");
    setIntroComplete(true);
  };

  return (
    <HelmetProvider>
      {!introComplete && <GoldsainteIntro onComplete={handleIntroComplete} />}
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ConfirmDialogHost />
          <InstallAppPrompt />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <AuthProvider>
              <LanguageProvider>
              <ExpediaModalProvider>
                <AppContent />
              </ExpediaModalProvider>
              </LanguageProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
