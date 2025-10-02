import { Home, Search, Heart, User, LogIn, LogOut, Clock, Hotel, Plane, UtensilsCrossed, Ticket, X, LayoutDashboard, Briefcase, ShieldCheck, Clipboard, DollarSign } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
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
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { format } from "date-fns";

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, authRequired: true },
  { title: "My Bookings", url: "/my-bookings", icon: Ticket, authRequired: true },
  { title: "Marketplace", url: "/marketplace", icon: Clipboard, authRequired: true },
  { title: "Search", url: "/search", icon: Search },
  { title: "Favorites", url: "/favorites", icon: Heart },
];

const bottomItems = [
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { user, signOut } = useAuth();
  const { isAdmin, isAgent } = useUserRole();
  const { history, removeItem } = useSearchHistory();
  const navigate = useNavigate();

  const getSearchIcon = (type: string) => {
    switch (type) {
      case "hotels": return Hotel;
      case "flights": return Plane;
      case "restaurants": return UtensilsCrossed;
      case "events": return Ticket;
      default: return Search;
    }
  };

  const handleHistoryClick = (item: any) => {
    const params = new URLSearchParams({
      type: item.type,
      location: item.location,
      ...(item.checkIn && { checkIn: item.checkIn }),
      ...(item.checkOut && { checkOut: item.checkOut }),
      ...(item.guests && { guests: item.guests }),
    });
    navigate(`/search?${params.toString()}`);
  };

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
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAgent && (
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
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Searches */}
        {history.length > 0 && (
          <SidebarGroup className="flex-1 overflow-hidden">
            <SidebarGroupLabel className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Searches
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {history.slice(0, 15).map((item) => {
                  const Icon = getSearchIcon(item.type);
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => handleHistoryClick(item)}
                        className="hover:bg-muted/50 group relative"
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {open && (
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="truncate text-sm font-medium">
                              {item.location}
                            </div>
                            {item.checkIn && (
                              <div className="text-xs text-muted-foreground truncate">
                                {format(new Date(item.checkIn), "MMM d")}
                                {item.checkOut && ` - ${format(new Date(item.checkOut), "MMM d")}`}
                              </div>
                            )}
                          </div>
                        )}
                        {open && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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
