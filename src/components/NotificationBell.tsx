import { useNotifications } from "@/hooks/useNotifications";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const { unreadCount } = useNotifications();

  return (
    <button className="relative inline-flex items-center justify-center">
      <Bell className="h-4 w-4 text-foreground" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-3 min-w-[12px] rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center px-0.5">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
