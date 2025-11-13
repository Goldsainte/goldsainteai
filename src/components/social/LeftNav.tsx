import { Home, Search, Compass, MessageCircle, Heart, PlusSquare, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePanelStore } from "@/stores/panelStore";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}

function NavItem({ icon, label, onClick, active }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-accent transition-colors",
        active && "font-bold"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function LeftNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openType } = usePanelStore();

  return (
    <nav className="p-4 space-y-2">
      <div className="mb-8 px-3 py-4">
        <h1 className="text-2xl font-bold">Goldsainte</h1>
      </div>
      
      <NavItem
        icon={<Home className="w-6 h-6" />}
        label="Home"
        onClick={() => navigate("/travel-feed")}
        active={location.pathname === "/travel-feed"}
      />
      
      <NavItem
        icon={<Search className="w-6 h-6" />}
        label="Search"
        onClick={() => openType("search")}
      />
      
      <NavItem
        icon={<Compass className="w-6 h-6" />}
        label="Explore"
        onClick={() => navigate("/explore")}
        active={location.pathname === "/explore"}
      />
      
      <NavItem
        icon={<MessageCircle className="w-6 h-6" />}
        label="Messages"
        onClick={() => openType("messages")}
      />
      
      <NavItem
        icon={<Heart className="w-6 h-6" />}
        label="Notifications"
        onClick={() => openType("notifications")}
      />
      
      <NavItem
        icon={<PlusSquare className="w-6 h-6" />}
        label="Create"
        onClick={() => navigate("/create-moment")}
        active={location.pathname === "/create-moment"}
      />
      
      <NavItem
        icon={<User className="w-6 h-6" />}
        label="Profile"
        onClick={() => navigate("/profile")}
        active={location.pathname === "/profile"}
      />
    </nav>
  );
}
