import { Store, PlaneTakeoff, Luggage, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function MobileBottomNav() {
  const { user } = useAuth();
  const accountType = (user?.user_metadata?.account_type as string | undefined)?.toLowerCase();
  const postTripTo = (accountType === "agent" || accountType === "creator") ? "/trip-builder" : "/post-trip";

  const getProfileRoute = () => {
    if (!user) return "/auth";
    const accountType = user.user_metadata?.account_type;
    switch (accountType) {
      case "creator":
        return `/creators/${user.id}`;
      case "agent":
        return `/agents/${user.id}`;
      default:
        return "/traveler";
    }
  };

  const navItems = [
    { to: "/marketplace", icon: Store, label: "Marketplace" },
    { to: postTripTo, icon: PlaneTakeoff, label: "Post a Trip" },
    { to: "/my-trips", icon: Luggage, label: "My Trips" },
    { to: getProfileRoute(), icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#bfad72] lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-4 h-16 safe-area-pb">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
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
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
