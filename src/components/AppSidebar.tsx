import { Home, Search, Heart, User, LogIn, LogOut, Clock, Hotel, Plane, Ticket, X, LayoutDashboard, Briefcase, ShieldCheck, Package, TrendingUp, Info, DollarSign, Users } from "lucide-react";
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
import { useSearchHistory } from "@/hooks/useSearchHistory";
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
  const { history, removeItem } = useSearchHistory();
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState<string | null>(null);

  const getSearchIcon = (type: string) => {
    switch (type) {
      case "hotel":
      case "hotels": return Hotel;
      case "flight":
      case "flights": return Plane;
      case "event":
      case "events": return Ticket;
      default: return Search;
    }
  };

  const handleHistoryClick = (item: any) => {
    // Helper to pluralize types for SearchResults route
    const getPluralType = (t: string) => {
      switch (t) {
        case 'flight':
          return 'flights';
        case 'hotel':
          return 'hotels';
        case 'event':
          return 'events';
        case 'destination':
          return 'destinations';
        default:
          return t.endsWith('s') ? t : `${t}s`;
      }
    };

    // Handle flight searches differently
    if (item.type === 'flight' && item.origin && item.destination) {
      const params = new URLSearchParams({
        type: 'flights',
        origin: item.origin,
        destination: item.destination,
        departureDate: item.departureDate || '',
        ...(item.returnDate && { returnDate: item.returnDate }),
        cabinClass: item.cabinClass || 'ECONOMY',
        adults: item.adults || '1',
        children: item.children || '0',
        infants: item.infants || '0',
        flightType: item.flightType || 'round-trip',
      } as any);
      navigate(`/search?${params.toString()}`);
    } else {
      // Handle hotels/events/destinations
      const params = new URLSearchParams({
        type: getPluralType(item.type),
        location: item.location || '',
        ...(item.checkIn && { checkIn: item.checkIn }),
        ...(item.checkOut && { checkOut: item.checkOut }),
        ...(item.guests && { guests: item.guests }),
      } as any);
      navigate(`/search?${params.toString()}`);
    }
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

        {/* Recent Searches */}
        {history.length > 0 && (
          <SidebarGroup className="flex-1 overflow-hidden">
            <SidebarGroupLabel className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Searches
            </SidebarGroupLabel>
            {open && (
              <div className="px-2 pb-2 flex gap-1 flex-wrap">
                <Button
                  variant={searchFilter === null ? "default" : "outline"}
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => setSearchFilter(null)}
                >
                  All
                </Button>
                <Button
                  variant={searchFilter === "flight" ? "default" : "outline"}
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => setSearchFilter("flight")}
                >
                  <Plane className="h-3 w-3 mr-1" />
                  Flights
                </Button>
                <Button
                  variant={searchFilter === "hotel" ? "default" : "outline"}
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => setSearchFilter("hotel")}
                >
                  <Hotel className="h-3 w-3 mr-1" />
                  Hotels
                </Button>
                <Button
                  variant={searchFilter === "event" ? "default" : "outline"}
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => setSearchFilter("event")}
                >
                  <Ticket className="h-3 w-3 mr-1" />
                  Events
                </Button>
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {history
                  .filter((item) => !['restaurant', 'restaurants', 'car', 'cars'].includes(item.type) && (searchFilter === null || item.type === searchFilter))
                  .map((item) => {
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
                              {item.type === 'flight' && item.origin && item.destination 
                                ? `${item.origin.split(' - ')[0]} → ${item.destination.split(' - ')[0]}`
                                : item.location}
                            </div>
                            {(item.departureDate || item.checkIn) && (
                              <div className="text-xs text-muted-foreground truncate">
                                {item.departureDate 
                                  ? format(new Date(item.departureDate), "MMM d")
                                  : format(new Date(item.checkIn), "MMM d")}
                                {(item.returnDate || item.checkOut) && 
                                  ` - ${format(new Date(item.returnDate || item.checkOut), "MMM d")}`}
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
