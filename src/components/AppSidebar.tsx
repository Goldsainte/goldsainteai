import { Home, Search, User, LogIn, LogOut, LayoutDashboard, Briefcase, ShieldCheck, TrendingUp, Info, DollarSign, Sparkles, Newspaper } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import logomark from "@/assets/logomark-gold.png";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { format } from "date-fns";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  authRequired?: boolean;
  showFor?: 'creator' | 'agent' | 'brand';
  hideFor?: ('creator' | 'agent' | 'brand')[];
}

const items: NavItem[] = [
  { title: "Home", url: "/", icon: Home },
  { title: "Explore", url: "/explore", icon: Search },
  { title: "My Collections", url: "/collections", icon: Sparkles, authRequired: true, hideFor: ['creator', 'agent', 'brand'] },
  { title: "Traveler Console", url: "/traveler", icon: LayoutDashboard, authRequired: true, hideFor: ['creator', 'agent', 'brand'] },
  { title: "The Collection", url: "/marketplace", icon: Briefcase, authRequired: true },
  { title: "My Jobs", url: "/my-jobs", icon: Briefcase, authRequired: true },
  { title: "Creator Earnings", url: "/agent/earnings", icon: DollarSign, authRequired: true, showFor: "creator" },
  { title: "About", url: "/about", icon: Info },
];

const bottomItems = [
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { user, signOut } = useAuth();
  const { isAdmin, isAgent } = useUserRole();
  const navigate = useNavigate();

  // Account type helpers
  const accountType = ((user as any)?.user_metadata?.account_type as string | undefined)?.toLowerCase() ?? null;
  const isCreator = accountType === "creator";
  const isAgentAccount = accountType === "agent";
  const isBrand = accountType === "brand";

  const shouldShowItem = (item: NavItem): boolean => {
    if (item.authRequired && !user) return false;
    if (item.showFor) {
      if (item.showFor === 'creator' && !isCreator) return false;
      if (item.showFor === 'agent' && !isAgentAccount) return false;
      if (item.showFor === 'brand' && !isBrand) return false;
    }
    if (item.hideFor) {
      if (item.hideFor.includes('creator') && isCreator) return false;
      if (item.hideFor.includes('agent') && isAgentAccount) return false;
      if (item.hideFor.includes('brand') && isBrand) return false;
    }
    return true;
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={logomark} alt="Logo" className="h-8 w-8" loading="lazy"/>
            {open && <span className="font-secondary font-semibold text-sm text-primary">Goldsainte.Ai</span>}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.filter(shouldShowItem).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent/10 text-accent font-medium"
                          : "hover:bg-muted/50"
                      }
                      data-tour={(item as any).tourId}
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {(isAdmin || isAgent) && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/agent-dashboard"
                        className={({ isActive }) =>
                          isActive
                            ? "bg-accent/10 text-accent font-medium"
                            : "hover:bg-muted/50"
                        }
                      >
                        <Briefcase className="h-5 w-5" />
                        {open && <span>Agent Dashboard</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/agent-performance"
                        className={({ isActive }) =>
                          isActive
                            ? "bg-accent/10 text-accent font-medium"
                            : "hover:bg-muted/50"
                        }
                      >
                        <TrendingUp className="h-5 w-5" />
                        {open && <span>Performance</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
              {isAdmin && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/admin/customer-verifications"
                        className={({ isActive }) =>
                          isActive
                            ? "bg-accent/10 text-accent font-medium"
                            : "hover:bg-muted/50"
                        }
                      >
                        <ShieldCheck className="h-5 w-5" />
                        {open && <span>Customer Verifications</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/admin/newsroom"
                        className={({ isActive }) =>
                          isActive
                            ? "bg-accent/10 text-accent font-medium"
                            : "hover:bg-muted/50"
                        }
                      >
                        <Newspaper className="h-5 w-5" />
                        {open && <span>Newsroom</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        {/* Bottom Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {user ? (
                <>
                  {bottomItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            isActive
                              ? "bg-accent/10 text-accent font-medium"
                              : "hover:bg-muted/50"
                          }
                        >
                          <item.icon className="h-5 w-5" />
                          {open && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-2 h-9 hover:bg-muted/50"
                      onClick={signOut}
                    >
                      <LogOut className="h-5 w-5" />
                      {open && <span className="ml-2">Sign Out</span>}
                    </Button>
                  </SidebarMenuItem>
                </>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/auth"
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent/10 text-accent font-medium"
                          : "hover:bg-muted/50"
                      }
                    >
                      <LogIn className="h-5 w-5" />
                      {open && <span>Sign In</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
