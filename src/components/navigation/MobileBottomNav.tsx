import { Home, Store, MessageCircle, Bell, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
import { useNotifications } from "@/hooks/useNotifications";

export function MobileBottomNav() {
  const { user } = useAuth();
  const { unreadCount: messageCount } = useUnreadMessageCount();
  const { unreadCount: notificationCount } = useNotifications();

  // Determine profile route based on user's account type
  const getProfileRoute = () => {
    if (!user) return "/auth";
    const accountType = user.user_metadata?.account_type;
    switch (accountType) {
      case "creator":
        return `/creator/${user.id}`;
      case "agent":
        return "/agent-dashboard";
      default:
        return "/traveler"; // Travelers and default
    }
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/marketplace", icon: Store, label: "Discover" },
    { to: "/messages", icon: MessageCircle, label: "Messages", badge: messageCount, requireAuth: true },
    { to: "/notifications", icon: Bell, label: "Alerts", badge: notificationCount, requireAuth: true },
    { to: getProfileRoute(), icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5DFC6] lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-5 h-16 safe-area-pb">
        {navItems.map((item) => {
          // Skip auth-required items for logged out users
          if (item.requireAuth && !user) {
            return (
              <NavLink
                key={item.label}
                to="/auth"
                className="flex flex-col items-center justify-center gap-1 text-[#8a9a9c] hover:text-[#0a2225] transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive 
                    ? "text-[#C7A962]" 
                    : "text-[#8a9a9c] hover:text-[#0a2225]"
                }`
              }
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] rounded-full bg-[#0a2225] text-[9px] font-bold text-white flex items-center justify-center px-1">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
