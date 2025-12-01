import { Home, Store, MessageCircle, Bell, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function MobileBottomNav() {
  const { user } = useAuth();

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
    { to: "/messages", icon: MessageCircle, label: "Messages", requireAuth: true },
    { to: "/notifications", icon: Bell, label: "Alerts", requireAuth: true },
    { to: getProfileRoute(), icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#bfad72] lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-5 h-16 safe-area-pb">
        {navItems.map((item) => {
          // Skip auth-required items for logged out users
          if (item.requireAuth && !user) {
            return (
              <NavLink
                key={item.label}
                to="/auth"
                className="flex flex-col items-center justify-center gap-1 text-[#0c4d47] transition-colors"
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
                    ? "text-[#0c4d47] font-semibold" 
                    : "text-[#0c4d47]/70"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
