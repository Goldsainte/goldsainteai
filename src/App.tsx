import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SimpleHeader } from "@/components/SimpleHeader";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import SearchResults from "./pages/SearchResults";
import HotelBooking from "./pages/HotelBooking";
import BookingConfirmation from "./pages/BookingConfirmation";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Favorites from "./pages/Favorites";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import AgentOnboarding from "./pages/AgentOnboarding";
import AgentDashboard from "./pages/AgentDashboard";
import AdminAgentApprovals from "./pages/AdminAgentApprovals";
import BookingPreferences from "./pages/BookingPreferences";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col w-full">
                  <SimpleHeader />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/agent-onboarding" element={<AgentOnboarding />} />
              <Route path="/agent-dashboard" element={<AgentDashboard />} />
              <Route path="/admin/agent-approvals" element={<AdminAgentApprovals />} />
              <Route path="/booking-preferences" element={<BookingPreferences />} />
              <Route path="/favorites" element={<Favorites />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/hotel-booking" element={<HotelBooking />} />
                    <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </div>
            </SidebarProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
