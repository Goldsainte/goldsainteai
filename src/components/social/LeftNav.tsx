import { NavLink } from "react-router-dom";
import { usePanelStore } from "@/stores/panelStore";
import { Home, Users, Video, Search, MessageCircle, Bell, BarChart3, User2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
        <NavItemLink to="/home"><Home className="w-6 h-6" /> Home</NavItemLink>
        <NavItemLink to="/browse-creators"><Users className="w-6 h-6" /> Creator Marketplace</NavItemLink>
        <NavItemLink to="/tiktok-lab"><Video className="w-6 h-6" /> TikTok Lab</NavItemLink>
        <NavItemBtn onClick={() => openType("search")}><Search className="w-6 h-6" /> Search</NavItemBtn>
        <NavItemBtn onClick={() => openType("messages")}><MessageCircle className="w-6 h-6" /> Messages</NavItemBtn>
        <NavItemBtn onClick={() => openType("notifications")}><Bell className="w-6 h-6" /> Notifications</NavItemBtn>
        <NavItemLink to="/creator-dashboard"><BarChart3 className="w-6 h-6" /> Dashboard</NavItemLink>
        <NavItemBtn onClick={() => {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) window.location.href = `/creator/${user.id}`;
          });
        }}><User2 className="w-6 h-6" /> Profile</NavItemBtn>
      </nav>
    </div>
  );
}
