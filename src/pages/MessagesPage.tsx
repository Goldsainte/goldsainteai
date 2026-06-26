import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { DirectMessageInbox } from "@/components/messaging/DirectMessageInbox";
import { BackButton } from "@/components/ui/BackButton";
import { Sparkles, UserCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col overflow-hidden bg-[#FDF9F0] h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)]">
      {/* Compact header — back button inline with the title */}
      <div className="container mx-auto w-full max-w-6xl px-4 pt-3 pb-2 shrink-0">
        {showProfileBanner && (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-[#C7B892] bg-[#FFFBF0] px-3 py-2 text-xs text-[#5a4a1a]">
            <div className="flex items-center gap-2 min-w-0">
              <UserCircle2 className="h-4 w-4 shrink-0 text-[#C7A962]" />
              <span className="truncate">Add your name so your specialist knows who they're talking to.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-[#C7B892] text-xs"
                onClick={() => navigate('/profile/edit')}
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
        )}

        <div className="flex items-center gap-1.5">
          <BackButton className="-ml-2" />
          <Sparkles className="hidden h-5 w-5 text-[#C7A962] sm:block" />
          <h1 className="font-secondary text-lg font-semibold text-[#0a2225] md:text-xl">
            Messages
          </h1>
          <p className="ml-2 hidden truncate text-xs text-[#5a6c6e] md:block">
            Your conversations with creators and travel agents
          </p>
        </div>
      </div>

      {/* Inbox fills the rest of the viewport; pad the bottom on mobile so the
          composer clears the fixed MobileBottomNav (lg:hidden). */}
      <div className="container mx-auto w-full max-w-6xl flex-1 min-h-0 px-4 pb-[4.75rem] lg:pb-3">
        <DirectMessageInbox />
      </div>
    </div>
  );
}
