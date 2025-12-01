import { Home, Store, MessageCircle, Bell, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
import { useNotifications } from "@/hooks/useNotifications";

export function MobileBottomNav() {
  const { user } = useAuth();
  const { unreadCount: messageCount } = useUnreadMessageCount();
  const { unreadCount: notificationCount } = useNotifications();

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/marketplace", icon: Store, label: "Discover" },
    { to: "/messages", icon: MessageCircle, label: "Messages", badge: messageCount, requireAuth: true },
    { to: "/notifications", icon: Bell, label: "Alerts", badge: notificationCount, requireAuth: true },
    { to: user ? `/creator/${user.id}` : "/auth", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden safe-area-pb">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          // Skip auth-required items for logged out users
          if (item.requireAuth && !user) {
            return (
              <NavLink
                key={item.label}
                to="/auth"
                className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center px-1">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
