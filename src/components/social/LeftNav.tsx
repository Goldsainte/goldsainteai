import { NavLink, useNavigate } from "react-router-dom";
import { usePanelStore } from "@/stores/panelStore";
import { Home, Search, MessageCircle, Bell, BarChart3, User2, Store, PlaneTakeoff, Sparkles, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useUnreadMessageCount();
  
  const accountType = 
    ((user as any)?.user_metadata?.account_type as string | undefined)?.toLowerCase() ?? null;
  const isCreator = accountType === "creator";
  const isAgentAccount = accountType === "agent";
  const isBrand = accountType === "brand";

  return (
    <div className="h-screen flex flex-col py-4">
      <div className="px-3 pb-4 text-2xl font-extrabold">GOLDSAINTE</div>
      <nav className="space-y-1">
        <NavItemLink to="/"><Home className="w-6 h-6" /> Home</NavItemLink>
        <NavItemLink to="/marketplace"><Store className="w-6 h-6" /> The Collection</NavItemLink>
        <NavItemLink to="/post-trip"><PlaneTakeoff className="w-6 h-6" /> Post a Trip</NavItemLink>
        
        {/* My Proposals - Agents and Creators */}
        {(isAgentAccount || isCreator) && (
          <NavItemLink to="/my-proposals"><FileText className="w-6 h-6" /> My Proposals</NavItemLink>
        )}
        
        {/* My Collections - Authenticated users only */}
        {user && (
          <NavItemLink to="/collections"><Sparkles className="w-6 h-6" /> My Collections</NavItemLink>
        )}
        
        <NavItemBtn onClick={() => openType("search")}><Search className="w-6 h-6" /> Search</NavItemBtn>
        
        {/* Messages - Navigate to full page instead of panel */}
        <NavItemLink to="/messages">
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          Messages
        </NavItemLink>
        
        <NavItemBtn onClick={() => openType("notifications")}><Bell className="w-6 h-6" /> Notifications</NavItemBtn>
        
        {/* Dashboard - Creators only */}
        {isCreator && (
          <NavItemLink to="/creator-dashboard"><BarChart3 className="w-6 h-6" /> Dashboard</NavItemLink>
        )}
        
        <NavItemBtn onClick={() => {
          supabase.auth.getUser().then(({ data: { user: u } }) => {
            if (!u) return;
            const at = ((u as any)?.user_metadata?.account_type as string | undefined)?.toLowerCase();
            if (at === 'creator') window.location.href = `/creator/${u.id}`;
            else if (at === 'agent') navigate('/agent-dashboard');
            else navigate('/traveler');
          });
        }}><User2 className="w-6 h-6" /> Profile</NavItemBtn>
      </nav>
    </div>
  );
}
