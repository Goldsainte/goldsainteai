import { Home, Search, Compass, Film, MessageCircle, Bell, PlusSquare, User, Menu, Store } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import logoHorizontal from "@/assets/primary-horizontal-logo-gold-2.png";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "Explore", url: "/trending", icon: Compass },
  { title: "Reels", url: "/trending", icon: Film },
  { title: "Messages", url: "/messages", icon: MessageCircle, badge: true },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Create", url: "/travel-profile", icon: PlusSquare },
  { title: "Profile", url: "/travel-profile", icon: User },
];

export function TravelSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-64 border-r border-border bg-background z-10">
      {/* Logo */}
      <div className="p-6 pb-8">
        <img src={logoHorizontal} alt="Goldsainte" className="h-8" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.title}>
              <NavLink
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-3 py-3 rounded-lg transition-colors hover:bg-muted/50 ${
                    isActive ? "font-bold" : "font-normal"
                  }`
                }
              >
                <item.icon className="h-6 w-6" strokeWidth={2} />
                <span className="text-base">{item.title}</span>
                {item.badge && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    1
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* More Menu */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 px-3 py-6 h-auto hover:bg-muted/50"
        >
          <Menu className="h-6 w-6" />
          <span className="text-base">More</span>
        </Button>
      </div>
    </div>
  );
}