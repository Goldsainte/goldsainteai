import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Compass, Video, MessageCircle, Heart, PlusSquare, User, MoreHorizontal, Briefcase } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import wordmarkGold from "@/assets/wordmark-gold.png";

const navigationItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "Explore", url: "/trending", icon: Compass },
  { title: "Journeys", url: "/?tab=journeys", icon: Video },
  { title: "Messages", url: "/messages", icon: MessageCircle },
  { title: "Notifications", url: "/dashboard", icon: Heart },
  { title: "Create", url: "/create", icon: PlusSquare },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { state } = useSidebar();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          {/* Logo */}
          <div className="px-3 py-4">
            <img 
              src={wordmarkGold} 
              alt="Goldsainte" 
              className="h-8 w-auto"
            />
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="h-12"
                  >
                    <item.icon className="h-6 w-6" />
                    {state !== "collapsed" && <span className="text-base">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Profile */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/travel-profile")}
                  isActive={location.pathname === "/travel-profile"}
                  tooltip="Profile"
                  className="h-12"
                >
                  {user ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                  {state !== "collapsed" && <span className="text-base">Profile</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Travel Hub */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/home")}
                  isActive={location.pathname === "/home"}
                  tooltip="Travel Hub"
                  className="h-12"
                >
                  <Briefcase className="h-6 w-6" />
                  {state !== "collapsed" && <span className="text-base">Travel Hub</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* More */}
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="More" className="h-12">
                  <MoreHorizontal className="h-6 w-6" />
                  {state !== "collapsed" && <span className="text-base">More</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
