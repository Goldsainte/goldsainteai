import { Home, Search, Heart, User, LogIn, LogOut, LayoutDashboard, Briefcase, ShieldCheck, Package, TrendingUp, Info, DollarSign, Users } from "lucide-react";
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

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, authRequired: true },
  { title: "Marketplace", url: "/marketplace", icon: Briefcase, authRequired: true },
  { title: "CoCurate™", url: "/cocurated-marketplace", icon: Package, tourId: "cocurated" },
  { title: "My Jobs", url: "/my-jobs", icon: Briefcase, authRequired: true },
  { title: "Browse Agents", url: "/browse-agents", icon: Users },
  { title: "Creator Earnings", url: "/creator-dashboard", icon: DollarSign, authRequired: true },
  { title: "Favorites", url: "/favorites", icon: Heart },
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

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={logomark} alt="Logo" className="h-8 w-8" />
            {open && <span className="font-secondary font-semibold text-sm text-primary">Goldsainte.Ai</span>}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.filter(item => !item.authRequired || user).map((item) => (
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
                        to="/commission-dashboard"
                        className={({ isActive }) =>
                          isActive
                            ? "bg-accent/10 text-accent font-medium"
                            : "hover:bg-muted/50"
                        }
                      >
                        <DollarSign className="h-5 w-5" />
                        {open && <span>Commission</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/admin/agent-approvals"
                        className={({ isActive }) =>
                          isActive
                            ? "bg-accent/10 text-accent font-medium"
                            : "hover:bg-muted/50"
                        }
                      >
                        <ShieldCheck className="h-5 w-5" />
                        {open && <span>Agent Approvals</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
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
