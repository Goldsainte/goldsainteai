import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";

export function MessageBubbleIcon() {
  const navigate = useNavigate();
  const { unreadCount } = useUnreadMessageCount();

  return (
    <button
      type="button"
      onClick={() => navigate("/messages")}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
      aria-label="Messages"
    >
      <MessageCircle className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
