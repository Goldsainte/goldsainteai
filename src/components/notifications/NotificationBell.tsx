import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchUnreadCount } from "@/services/notificationService";

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [pulse, setPulse] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Initial fetch
  useEffect(() => {
    if (!user) { setUnread(0); return; }
    fetchUnreadCount().then(setUnread).catch(() => {});
  }, [user]);

  // Resync whenever the tab regains focus — belt-and-braces alongside
  // realtime, so the badge is correct the moment you switch back.
  useEffect(() => {
    if (!user) return;
    const resync = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount().then(setUnread).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("focus", resync);
    return () => {
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("focus", resync);
    };
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notif-bell-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          setUnread((prev) => prev + 1);
          // Trigger pulse animation
          setPulse(true);
          setTimeout(() => setPulse(false), 1500);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).is_read === true && !(payload.old as any)?.is_read) {
            setUnread((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <button
      type="button"
      onClick={() => navigate("/notifications")}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-white/20"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span
          className={`absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg ${
            pulse ? "animate-bounce" : ""
          }`}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}
