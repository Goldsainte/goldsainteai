import { NavLink } from "react-router-dom";
import { Home, Search, Compass, Video, MessageCircle, Heart, PlusSquare, BarChart3, User, Menu } from "lucide-react";
import logoWordmark from "@/assets/primary-horizontal-logo-gold-2.png";
import { useAuth } from "@/contexts/AuthContext";

export function FeedSidebar() {
  const { user } = useAuth();

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/trending", icon: Compass, label: "Explore" },
    { to: "/travel-feed", icon: Video, label: "Journeys" },
    { to: "/messages", icon: MessageCircle, label: "Messages" },
    { to: "/favorites", icon: Heart, label: "Notifications" },
    { to: "/creator-dashboard", icon: BarChart3, label: "Dashboard" },
    { to: "/travel-profile", icon: User, label: "Profile" },
  ];

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 px-3 py-3 rounded-lg transition-colors ${
      isActive
        ? "font-semibold"
        : "font-normal hover:bg-muted/50"
    }`;

  return (
    <aside className="w-60 h-screen sticky top-0 border-r border-border bg-background flex flex-col px-3 py-8">
      {/* Logo */}
      <div className="mb-8 px-3">
        <img src={logoWordmark} alt="Goldsainte" className="h-8" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={getNavClass}
            end={item.to === "/"}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-base">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* More Menu at bottom */}
      <button className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors font-normal w-full">
        <Menu className="h-6 w-6" />
        <span className="text-base">More</span>
      </button>
    </aside>
  );
}
