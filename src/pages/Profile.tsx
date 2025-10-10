import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreditCard, Settings, Heart, Briefcase, ArrowLeft, MapPin, Globe, Phone, User, Mail } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { EditProfileDialog } from "@/components/EditProfileDialog";

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
  const { isAgent, loading: roleLoading } = useUserRole();
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
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="mb-8">
          <h1 className="text-4xl font-secondary text-primary mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="max-w-3xl space-y-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="font-secondary">Personal Information</CardTitle>
              <CardDescription>
                Your profile details and public information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {profile?.first_name && profile?.last_name
                            ? `${profile.first_name} ${profile.last_name}`
                            : profile?.username || 'User'}
                        </h3>
                        {profile?.username && (
                          <p className="text-sm text-muted-foreground">@{profile.username}</p>
                        )}
                      </div>
                      <Button 
                        onClick={() => setEditProfileOpen(true)}
                        size="sm"
                      >
                        Edit Profile
                      </Button>
                    </div>
                    {profile?.bio && (
                      <p className="text-sm text-muted-foreground">{profile.bio}</p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span>{user.email}</span>
                  </div>
                  
                  {profile?.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{profile.phone}</span>
                    </div>
                  )}

                  {profile?.website && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Website:</span>
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
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Location:</span>
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Management Card */}
          <Card>
            <CardHeader>
              <CardTitle className="font-secondary">Account Management</CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Payment & Preferences</h3>
                  <div className="space-y-2">
                  <Button 
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke('customer-portal');
                        if (error) throw error;
                        if (data?.url) {
                          window.open(data.url, '_blank');
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
                    onClick={() => navigate('/booking-preferences')}
                  >
                    <Settings className="h-4 w-4" />
                    Booking Preferences & AI Assistant
                  </Button>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h3 className="font-semibold">Quick Actions</h3>
                  <div className="space-y-2">
                  <Button onClick={() => navigate('/favorites')} variant="outline" className="w-full justify-start gap-2">
                    <Heart className="h-4 w-4" />
                    View Favorites
                  </Button>
                  <Button onClick={() => navigate('/my-trips')} variant="outline" className="w-full justify-start gap-2">
                    <MapPin className="h-4 w-4" />
                    Manage My Trips & Itineraries
                  </Button>
                  <Button onClick={() => navigate('/marketplace')} variant="outline" className="w-full justify-start gap-2">
                    <Briefcase className="h-4 w-4" />
                    Post Complex Booking Job
                  </Button>
                  {!isAgent && !roleLoading && (
                    <Button onClick={() => navigate('/agent-onboarding')} variant="outline" className="w-full justify-start gap-2">
                      <Briefcase className="h-4 w-4" />
                      Become a Travel Agent
                    </Button>
                  )}
                  </div>
                </div>
              </div>
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
