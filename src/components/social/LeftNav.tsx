import { NavLink } from "react-router-dom";
import { usePanelStore } from "@/stores/panelStore";
import { Home, Compass, Search, MessageCircle, Bell, PlusSquare, User2 } from "lucide-react";

const itemCls = "flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/60 text-base";

function NavItemLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink to={to} className={({ isActive }) => `${itemCls} ${isActive ? "font-semibold" : ""}`}>
      {children}
    </NavLink>
  );
}

function NavItemBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={itemCls}>
      {children}
    </button>
  );
}

export default function LeftNav() {
  const { openType } = usePanelStore();

  return (
    <div className="h-screen flex flex-col py-4">
      <div className="px-3 pb-4 text-2xl font-extrabold">GOLDSAINTE</div>
      <nav className="space-y-1">
        <NavItemLink to="/travel-feed"><Home className="w-6 h-6" /> Home</NavItemLink>
        <NavItemBtn onClick={() => openType("search")}><Search className="w-6 h-6" /> Search</NavItemBtn>
        <NavItemLink to="/explore"><Compass className="w-6 h-6" /> Explore</NavItemLink>
        <NavItemBtn onClick={() => openType("messages")}><MessageCircle className="w-6 h-6" /> Messages</NavItemBtn>
        <NavItemBtn onClick={() => openType("notifications")}><Bell className="w-6 h-6" /> Notifications</NavItemBtn>
        <NavItemLink to="/create-moment"><PlusSquare className="w-6 h-6" /> Create</NavItemLink>
        <NavItemLink to="/profile"><User2 className="w-6 h-6" /> Profile</NavItemLink>
      </nav>
    </div>
  );
}
