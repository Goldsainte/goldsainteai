import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings, Grid, Bookmark, Tag, UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditProfileDialog } from './EditProfileDialog';

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

interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
}

export const InstagramProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ posts: 0, followers: 0, following: 0 });
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    // Set mock stats for now
    setStats({
      posts: 12,
      followers: 324,
      following: 187,
    });
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading profile...</div>
      </div>
    );
  }

  const displayName = profile.first_name && profile.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile.username || 'User';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Avatar */}
        <div className="flex justify-center md:justify-start">
          <Avatar className="h-32 w-32 md:h-40 md:w-40">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
              {displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Profile Info */}
        <div className="flex-1 space-y-4">
          {/* Username and Actions */}
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-xl font-normal">{profile.username || 'user'}</h1>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              Edit profile
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-8">
            <div className="text-center md:text-left">
              <span className="font-semibold">{stats.posts}</span> posts
            </div>
            <button className="text-center md:text-left hover:opacity-70 transition-opacity">
              <span className="font-semibold">{stats.followers}</span> followers
            </button>
            <button className="text-center md:text-left hover:opacity-70 transition-opacity">
              <span className="font-semibold">{stats.following}</span> following
            </button>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <p className="font-semibold">{displayName}</p>
            {profile.bio && (
              <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline block"
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate('/stream-messages')}
            >
              Message
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Follow
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full justify-center border-t">
          <TabsTrigger value="posts" className="flex-1">
            <Grid className="h-4 w-4 mr-2" />
            POSTS
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1">
            <Bookmark className="h-4 w-4 mr-2" />
            SAVED
          </TabsTrigger>
          <TabsTrigger value="tagged" className="flex-1">
            <Tag className="h-4 w-4 mr-2" />
            TAGGED
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {/* Posts grid would go here */}
            <div className="aspect-square bg-muted rounded flex items-center justify-center text-muted-foreground">
              No posts yet
            </div>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            <div className="aspect-square bg-muted rounded flex items-center justify-center text-muted-foreground">
              No saved posts
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tagged" className="mt-4">
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            <div className="aspect-square bg-muted rounded flex items-center justify-center text-muted-foreground">
              No tagged posts
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      {profile && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={profile}
          onProfileUpdated={fetchProfile}
        />
      )}
    </div>
  );
};
