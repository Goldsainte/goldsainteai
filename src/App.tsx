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
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ConfirmDialogHost />
          <InstallAppPrompt />
          <BrowserRouter>
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
