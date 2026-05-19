import { NavLink, useNavigate } from "react-router-dom";
import { Home, Users, MessageCircle, BarChart3, User, LogOut } from "lucide-react";
import logoWordmark from "@/assets/primary-horizontal-logo-gold-2.png";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function FeedSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Gate sidebar for creators only
  const accountType = 
    ((user as any)?.user_metadata?.account_type as string | undefined)?.toLowerCase() ?? null;
  const isCreator = accountType === "creator";

  // Don't render sidebar for non-creators
  if (!isCreator) return null;

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url, username')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setAvatarUrl(data.avatar_url);
      setUsername(data.username);
    }
  };

  const navItems = [
    { to: "/home", icon: Home, label: "Home" },
    { to: "/marketplace", icon: Users, label: "Marketplace" },
    { to: "/messages", icon: MessageCircle, label: "Messages" },
    { to: "/creator-dashboard", icon: BarChart3, label: "Dashboard" },
  ];

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 px-3 py-3 rounded-lg transition-colors ${
      isActive
        ? "font-semibold [&>svg]:text-[#BFAD72] [&>span]:text-[#BFAD72]"
        : "font-normal hover:bg-muted/50"
    }`;

  return (
    <aside className="w-60 h-screen sticky top-0 border-r border-border bg-background flex flex-col px-3 py-8">
      {/* Logo */}
      <div className="mb-8 px-3">
        <img src={logoWordmark} alt="Goldsainte" className="h-8" loading="lazy"/>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={getNavClass}
            end={item.to === "/" || item.to === "/home"}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-base">{item.label}</span>
          </NavLink>
        ))}
        
        {/* Notifications */}
        {user && <NotificationCenter />}
        
        {/* Profile with Avatar */}
        <button
          onClick={async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) navigate(`/creator/${user.id}`);
          }}
          className={getNavClass({ isActive: false })}
        >
          {avatarUrl ? (
            <Avatar className="h-6 w-6">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <User className="h-6 w-6" />
          )}
          <span className="text-base">Profile</span>
        </button>
      </nav>

      {/* Sign Out Button */}
      <button 
        onClick={signOut}
        className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors font-normal w-full text-destructive hover:text-destructive"
      >
        <LogOut className="h-6 w-6" />
        <span className="text-base">Sign Out</span>
      </button>
    </aside>
  );
}
