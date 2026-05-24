import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreditCard, Settings, Sparkles, Briefcase, MapPin, Globe, Phone, User, Mail, Share2, LayoutDashboard, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { BackButton } from "@/components/ui/BackButton";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  phone: string | null;
  website: string | null;
  location: string | null;
  instagram_username: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin, isAgent, loading: roleLoading } = useUserRole();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      fetchProfile();
    }
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile({
          id: data.id,
          username: data.username,
          avatar_url: data.avatar_url,
          first_name: data.first_name,
          last_name: data.last_name,
          bio: data.bio,
          phone: data.phone,
          website: data.website,
          location: data.location,
          instagram_username: data.instagram_username,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 md:pb-0">
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8 max-w-3xl">
        <BackButton className="mb-4" />

        {/* Profile Header */}
        <div className="space-y-4 mb-6">
          {/* Avatar and Name */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 md:h-24 md:w-24">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold text-xl md:text-2xl uppercase tracking-wide">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile?.username || 'User'}
              </h2>
              {profile?.username && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <p className="text-sm">{profile.bio}</p>
          )}

          {/* Profile Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile?.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            {profile?.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          {/* Dashboard Stats Section */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-1">Your dashboard</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span>View your activity and bookings</span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate('/traveler')}
              className="w-full"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="secondary"
              onClick={() => setEditProfileOpen(true)}
              className="w-full"
            >
              Edit profile
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const profileUrl = `${window.location.origin}/creator/${profile?.username || user.id}`;
                navigator.clipboard.writeText(profileUrl);
                toast.success('Profile link copied!');
              }}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Account Management Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment & Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const headers = {
                      Authorization: `Bearer ${session?.access_token}`,
                    };
                    const { data, error } = await supabase.functions.invoke('customer-portal', { headers });
                    if (error) throw error;
                    if (data?.url) {
                      window.location.assign(data.url);
                    }
                  } catch (error: any) {
                    toast.error('Failed to open payment portal');
                  }
                }}
                variant="outline" 
                className="w-full justify-start gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Manage Payment Methods
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigate('/dashboard?tab=preferences')}
              >
                <Settings className="h-4 w-4" />
                Booking Preferences & AI Assistant
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={() => navigate('/my-trip-requests')} variant="outline" className="w-full justify-start gap-2">
                <Sparkles className="h-4 w-4" />
                View Trip Requests
              </Button>
              <Button onClick={() => navigate('/my-trips')} variant="outline" className="w-full justify-start gap-2">
                <MapPin className="h-4 w-4" />
                Manage My Trips & Itineraries
              </Button>
              <Button onClick={() => navigate('/marketplace')} variant="outline" className="w-full justify-start gap-2">
                <Briefcase className="h-4 w-4" />
                Post Complex Booking Job
              </Button>
              <Button onClick={() => navigate('/customer-verification')} variant="outline" className="w-full justify-start gap-2">
                <Settings className="h-4 w-4" />
                Identity Verification
              </Button>
              <Button onClick={() => navigate('/emergency-contacts')} variant="outline" className="w-full justify-start gap-2">
                <Phone className="h-4 w-4" />
                Emergency Contacts
              </Button>
              {!isAdmin && !isAgent && !roleLoading && (
                <Button onClick={() => navigate('/apply/agent/signup')} variant="outline" className="w-full justify-start gap-2">
                  <Briefcase className="h-4 w-4" />
                  Become a Travel Agent
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Profile Dialog */}
      {profile && (
        <EditProfileDialog
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
          profile={profile}
          onProfileUpdated={fetchProfile}
        />
      )}
    </div>
  );
}
