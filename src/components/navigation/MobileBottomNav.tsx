import { Home, Store, MessageCircle, Bell, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

export function MobileBottomNav() {
  const { user } = useAuth();
  const { t } = useTranslation();

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
    { to: "/", icon: Home, labelKey: "nav.home" },
    { to: "/marketplace", icon: Store, labelKey: "nav.discover" },
    { to: "/messages", icon: MessageCircle, labelKey: "nav.messages", requireAuth: true },
    { to: "/notifications", icon: Bell, labelKey: "nav.alerts", requireAuth: true },
    { to: getProfileRoute(), icon: User, labelKey: "nav.profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#bfad72] lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-5 h-16 safe-area-pb">
        {navItems.map((item) => {
          // Skip auth-required items for logged out users
          if (item.requireAuth && !user) {
            return (
              <NavLink
                key={item.labelKey}
                to="/auth"
                className="flex flex-col items-center justify-center gap-1 text-[#0c4d47] transition-colors touch-manipulation min-h-[48px]"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.labelKey}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-colors touch-manipulation min-h-[48px] ${
                  isActive 
                    ? "text-[#0c4d47] font-semibold" 
                    : "text-[#0c4d47]/70"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
