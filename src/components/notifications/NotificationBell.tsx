// src/components/notifications/NotificationBell.tsx
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchUnreadCount } from "@/services/notificationService";

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const count = await fetchUnreadCount();
        if (!cancelled) setUnread(count);
      } catch {
        // ignore
      }
    }
    load();

    // Optional: poll every 60s
    const id = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => navigate("/notifications")}
      className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 border border-[#E5DFC6] text-[#0a2225] hover:bg-white"
    >
      <Bell className="h-4 w-4" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0c4d47] px-1 text-[9px] text-[#E5DFC6]">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}
