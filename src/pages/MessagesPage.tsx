import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { DirectMessageInbox } from "@/components/messaging/DirectMessageInbox";
import { BackButton } from "@/components/ui/BackButton";
import { Sparkles, UserCircle2, X, Home, Compass, MessageCircle, Luggage, FileText, LayoutDashboard } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// IG-style expanded sidebar — icon + label rows, bold active item, hover
// pill, Profile row with avatar — Goldsainte's verified links only.
function MessagesRail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCreator, isAgent, isAdmin, isBrand } = useUserRole();
  const isPro = isCreator || isAgent || isAdmin || isBrand;
  const items: { icon: any; label: string; to: string; active?: boolean }[] = [
    { icon: Home, label: "Home", to: "/" },
    { icon: Compass, label: "Marketplace", to: "/marketplace" },
    { icon: MessageCircle, label: "Messages", to: "/messages", active: true },
    { icon: Luggage, label: "My Journeys", to: "/my-bookings" },
    ...(isPro
      ? [
          { icon: FileText, label: "My Proposals", to: "/my-proposals" },
          {
            icon: LayoutDashboard,
            label: "Dashboard",
            to: isCreator ? "/creator-dashboard" : "/agent-dashboard",
          },
        ]
      : []),
  ];
  const initial = (user?.email?.[0] || "G").toUpperCase();
  return (
    <aside className="hidden lg:flex w-[260px] xl:w-[300px] shrink-0 flex-col border-r border-[#E5DFC6] bg-[#FDF9F0] px-3 pb-5 pt-7">
      <span className="mb-8 px-3 font-secondary text-[19px] font-semibold tracking-[0.16em] text-[#0c4d47]">
        GOLDS<span className="text-[#C7A962]">A</span>INTE
      </span>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ icon: Icon, label, to, active }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className={`flex items-center gap-4 rounded-xl px-3 py-3 text-left text-[16px] transition-colors hover:bg-white/80 ${
              active ? "font-bold text-[#0a2225]" : "text-[#0a2225]/85"
            }`}
          >
            <Icon className="h-6 w-6 shrink-0" strokeWidth={active ? 2.4 : 1.7} />
            {label}
          </button>
        ))}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-4 rounded-xl px-3 py-3 text-left text-[16px] text-[#0a2225]/85 transition-colors hover:bg-white/80"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0c4d47] text-[11px] font-semibold text-[#E5DFC6]">
            {initial}
          </span>
          Profile
        </button>
      </nav>
    </aside>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  const [showProfileBanner, setShowProfileBanner] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isReady && !user) {
      navigate("/auth?redirect=/messages");
    }
  }, [user, isReady, navigate]);

  // Show a soft nudge to add their name if the profile is incomplete.
  // This is particularly common for magic-link users who arrived via
  // "Ask a Question" without going through the usual onboarding flow.
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data && !data.first_name?.trim()) {
          setShowProfileBanner(true);
        }
      });
  }, [user]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#FDF9F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C7A962]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex overflow-hidden bg-[#FDF9F0] h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)]">
      <MessagesRail />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* IG-style full-bleed shell: no page header, no gutters — the inbox
          IS the page. The profile nudge floats as a slim strip when needed. */}
      {showProfileBanner && (
      <div className="w-full px-3 pt-2 shrink-0">
          <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-[#C7B892] bg-[#FFFBF0] px-3 py-2 text-xs text-[#5a4a1a]">
            <div className="flex items-center gap-2 min-w-0">
              <UserCircle2 className="h-4 w-4 shrink-0 text-[#C7A962]" />
              <span className="min-w-0 leading-snug">Add your name so your specialist knows who they're talking to.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-[#C7B892] text-xs"
                onClick={() => navigate('/profile')}
              >
                Add name
              </Button>
              <button
                aria-label="Dismiss"
                onClick={() => setShowProfileBanner(false)}
                className="text-[#9A8060] hover:text-[#5a4a1a]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
      </div>
      )}

      {/* Inbox fills the entire viewport below the nav — edge to edge. */}
      <div className="w-full flex-1 min-h-0">
        <DirectMessageInbox />
      </div>
      </div>
    </div>
  );
}
