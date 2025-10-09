import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight,
  UserCircle,
  Bookmark,
  Archive,
  Activity,
  Bell,
  Clock,
  Lock,
  Star,
  Grid2X2,
  Ban,
  MapPin,
  Loader2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const TravelSettings2 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      setLoading(false);
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const SettingsItem = ({ 
    icon: Icon, 
    title, 
    description, 
    badge,
    onClick 
  }: { 
    icon: any; 
    title: string; 
    description?: string; 
    badge?: string | number;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
    >
      <Icon className="h-6 w-6 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium">{title}</div>
        {description && (
          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {description}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-sm text-muted-foreground">{badge}</span>
        )}
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold">Settings and activity</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Accounts Center */}
        <div className="py-6">
          <SettingsItem
            icon={UserCircle}
            title="Accounts Center"
            description="Password, security, personal details, ad preferences"
            onClick={() => navigate('/travel-settings')}
          />
        </div>

        <div className="px-4 py-2">
          <p className="text-xs text-muted-foreground">
            Manage your connected experiences and account settings across Meta technologies.{" "}
            <span className="text-primary cursor-pointer">Learn more</span>
          </p>
        </div>

        <Separator className="my-2" />

        {/* How you use Instagram */}
        <div className="py-4">
          <div className="px-4 py-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              How you use Horizon
            </h2>
          </div>

          <SettingsItem
            icon={Bookmark}
            title="Saved"
            onClick={() => navigate('/favorites')}
          />
          <SettingsItem
            icon={Archive}
            title="Archive"
            onClick={() => {}}
          />
          <SettingsItem
            icon={Activity}
            title="Your activity"
            onClick={() => {}}
          />
          <SettingsItem
            icon={Bell}
            title="Notifications"
            onClick={() => {}}
          />
          <SettingsItem
            icon={Clock}
            title="Time management"
            onClick={() => {}}
          />
        </div>

        <Separator className="my-2" />

        {/* Who can see your content */}
        <div className="py-4">
          <div className="px-4 py-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Who can see your content
            </h2>
          </div>

          <SettingsItem
            icon={Lock}
            title="Account privacy"
            badge="Public"
            onClick={() => {}}
          />
          <SettingsItem
            icon={Star}
            title="Close Friends"
            badge="0"
            onClick={() => {}}
          />
          <SettingsItem
            icon={Grid2X2}
            title="Crossposting"
            onClick={() => {}}
          />
          <SettingsItem
            icon={Ban}
            title="Blocked"
            badge="0"
            onClick={() => {}}
          />
          <SettingsItem
            icon={MapPin}
            title="Story, live and location"
            onClick={() => {}}
          />
        </div>

        <Separator className="my-2" />

        {/* More info and support */}
        <div className="py-4">
          <div className="px-4 py-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              More info and support
            </h2>
          </div>

          <SettingsItem
            icon={Activity}
            title="Help"
            onClick={() => {}}
          />
          <SettingsItem
            icon={Lock}
            title="Privacy Center"
            onClick={() => {}}
          />
          <SettingsItem
            icon={UserCircle}
            title="Account Status"
            onClick={() => {}}
          />
          <SettingsItem
            icon={Activity}
            title="About"
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default TravelSettings2;
