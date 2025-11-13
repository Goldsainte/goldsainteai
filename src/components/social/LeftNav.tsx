import { NavLink } from "react-router-dom";
import { usePanelStore } from "@/stores/panelStore";
import { Home, Compass, Search, MessageCircle, Heart, PlusSquare, User2 } from "lucide-react";

function Item({
  children,
  onClick,
  to,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  to?: string;
}) {
  const base = "flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/60 text-base";
  if (to) {
    return (
      <NavLink to={to} className={({ isActive }) => `${base} ${isActive ? "font-semibold" : ""}`}>
        {children}
      </NavLink>
    );
  }
  return (
    <button onClick={onClick} className={base}>
      {children}
    </button>
  );
}

export default function LeftNav() {
  const { openType } = usePanelStore();
  return (
    <div className="h-screen flex flex-col p-3">
      <div className="px-3 py-4 text-2xl font-extrabold">Goldsainte</div>
      <nav className="space-y-1">
        <Item to="/travel-feed"><Home className="w-6 h-6"/> Home</Item>
        <Item onClick={() => openType("search")}><Search className="w-6 h-6"/> Search</Item>
        <Item to="/explore"><Compass className="w-6 h-6"/> Explore</Item>
        <Item onClick={() => openType("messages")}><MessageCircle className="w-6 h-6"/> Messages</Item>
        <Item onClick={() => openType("notifications")}><Heart className="w-6 h-6"/> Notifications</Item>
        <Item to="/create-moment"><PlusSquare className="w-6 h-6"/> Create</Item>
        <Item to="/profile"><User2 className="w-6 h-6"/> Profile</Item>
      </nav>
    </div>
  );
}
