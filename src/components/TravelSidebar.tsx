import { Home, Search, Compass, Film, MessageCircle, Bell, PlusSquare, User, Menu, Settings, Activity, Bookmark, Sun, Moon, AlertCircle, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { CreateMomentModal } from "@/components/CreateMomentModal";
import logoHorizontal from "@/assets/primary-horizontal-logo-gold-2.png";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "Explore", url: "/trending", icon: Compass },
  { title: "Journeys", url: "/travel-feed", icon: Film },
  { title: "Messages", url: "/messages", icon: MessageCircle },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
];

export function TravelSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createMomentOpen, setCreateMomentOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, username')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      setAvatarUrl(data?.avatar_url || null);
      setUsername(data?.username || 'User');
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate('/auth');
    toast.success('Signed out successfully');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleCreateClick = () => {
    if (!user) {
      navigate('/auth');
      toast.error('Please sign in to create content');
      return;
    }
    setCreateMomentOpen(true);
  };

  const handleCreateContent = (type: string) => {
    if (type === "reel") {
      setCreateSheetOpen(false);
      setUploadInitialTab("video");
      setUploadModalOpen(true);
    } else if (type === "post") {
      setCreateSheetOpen(false);
      setUploadInitialTab("photo");
      setUploadModalOpen(true);
    } else if (type === "moment") {
      setCreateSheetOpen(false);
      setCreateMomentOpen(true);
    } else if (type === "moments-vault") {
      toast.info("Go to your profile to create moments vaults");
      setCreateSheetOpen(false);
    }
  };

  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
  };

  return (
    <div className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-64 border-r border-border bg-background z-10">
      {/* Logo */}
      <div className="p-6 pb-8">
        <img src={logoHorizontal} alt="Goldsainte" className="h-8" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.title}>
              <NavLink
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-3 py-3 rounded-lg transition-colors hover:bg-muted/50 ${
                    isActive ? "font-bold" : "font-normal"
                  }`
                }
              >
                <item.icon className="h-6 w-6" strokeWidth={2} />
                <span className="text-base">{item.title}</span>
              </NavLink>
            </li>
          ))}
          
          {/* Profile with Create submenu */}
          <li>
            <Collapsible open={profileOpen} onOpenChange={setProfileOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between gap-4 px-3 py-3 rounded-lg transition-colors hover:bg-muted/50 w-full">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-base">Profile</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-11 mt-1 space-y-1">
                  <Button
                    variant="ghost"
                    onClick={handleCreateClick}
                    className="w-full justify-start gap-3 px-3 py-2 h-auto hover:bg-muted/50 rounded-lg"
                  >
                    <PlusSquare className="h-5 w-5" />
                    <span className="text-sm">Create Content</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      supabase.auth.getUser().then(({ data: { user } }) => {
                        if (user) navigate(`/creator/${user.id}`);
                      });
                      setProfileOpen(false);
                    }}
                    className="w-full justify-start gap-3 px-3 py-2 h-auto hover:bg-muted/50 rounded-lg"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm">View Profile</span>
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </li>
        </ul>
      </nav>

      {/* More Menu */}
      <div className="p-3 border-t border-border">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-4 px-3 py-6 h-auto hover:bg-muted/50"
            >
              <Menu className="h-6 w-6" />
              <span className="text-base">More</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            side="top" 
            align="start" 
            className="w-64 p-0 bg-popover border shadow-lg z-[100]"
            sideOffset={8}
          >
            <div className="py-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-4 py-3 h-auto hover:bg-accent rounded-none"
                onClick={() => handleNavigation('/travel-settings-2')}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-4 py-3 h-auto hover:bg-accent rounded-none"
                onClick={() => handleNavigation('/your-activity')}
              >
                <Activity className="h-5 w-5" />
                <span>Your activity</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-4 py-3 h-auto hover:bg-accent rounded-none"
                onClick={toggleTheme}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span>Switch appearance</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-4 py-3 h-auto hover:bg-accent rounded-none"
                onClick={() => handleNavigation('/admin/trust-safety')}
              >
                <AlertCircle className="h-5 w-5" />
                <span>Report a problem</span>
              </Button>
              
              <Separator className="my-2" />
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-4 py-3 h-auto hover:bg-accent rounded-none"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                <span>Log out</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Create Moment Modal */}
      <CreateMomentModal
        open={createMomentOpen}
        onOpenChange={setCreateMomentOpen}
      />
    </div>
  );
}