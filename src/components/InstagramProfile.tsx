import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings, Grid, Bookmark, Tag, MoreHorizontal, Heart, MessageCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditProfileDialog } from './EditProfileDialog';
import { PostGridSkeleton } from './PostGridSkeleton';

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
    <div className="min-h-screen bg-background">
      <div className="max-w-[935px] mx-auto px-4 sm:px-5 py-8">
        {/* Profile Header */}
        <header className="mb-11">
          <div className="flex gap-7 md:gap-28 mb-11">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="h-20 w-20 md:h-[150px] md:w-[150px] ring-1 ring-border">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl md:text-5xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              {/* Username and Actions */}
              <div className="flex items-center gap-2 md:gap-5 mb-5 flex-wrap">
                <h2 className="text-xl font-light">{profile.username || 'user'}</h2>
                <Button
                  variant="secondary"
                  size="sm"
                  className="px-4 py-1.5 h-8 font-semibold rounded-lg"
                  onClick={() => setEditOpen(true)}
                >
                  Edit profile
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="px-4 py-1.5 h-8 font-semibold rounded-lg"
                >
                  View archive
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-5 w-5" />
                </Button>
              </div>

              {/* Stats - Desktop */}
              <div className="hidden md:flex gap-10 mb-5">
                <div>
                  <span className="font-semibold">{stats.posts}</span>
                  <span className="text-foreground ml-1">posts</span>
                </div>
                <button className="hover:opacity-70 transition-opacity">
                  <span className="font-semibold">{stats.followers}</span>
                  <span className="text-foreground ml-1">followers</span>
                </button>
                <button className="hover:opacity-70 transition-opacity">
                  <span className="font-semibold">{stats.following}</span>
                  <span className="text-foreground ml-1">following</span>
                </button>
              </div>

              {/* Bio */}
              <div className="hidden md:block">
                <h1 className="font-semibold">{displayName}</h1>
                {profile.bio && (
                  <p className="text-sm whitespace-pre-wrap mt-1">{profile.bio}</p>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-primary hover:text-primary/80 mt-1 inline-block"
                  >
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bio - Mobile */}
          <div className="md:hidden mb-5">
            <h1 className="font-semibold">{displayName}</h1>
            {profile.bio && (
              <p className="text-sm whitespace-pre-wrap mt-1">{profile.bio}</p>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary hover:text-primary/80 mt-1 inline-block"
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>

          {/* Stats - Mobile */}
          <div className="flex md:hidden border-t border-border pt-3">
            <div className="flex-1 text-center">
              <div className="font-semibold">{stats.posts}</div>
              <div className="text-xs text-muted-foreground">posts</div>
            </div>
            <div className="flex-1 text-center border-l border-border">
              <div className="font-semibold">{stats.followers}</div>
              <div className="text-xs text-muted-foreground">followers</div>
            </div>
            <div className="flex-1 text-center border-l border-border">
              <div className="font-semibold">{stats.following}</div>
              <div className="text-xs text-muted-foreground">following</div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full h-auto p-0 bg-transparent border-t border-border">
            <TabsTrigger
              value="posts"
              className="flex-1 data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none py-3 gap-1.5"
            >
              <Grid className="h-3 w-3" />
              <span className="text-xs font-semibold uppercase tracking-wider">Posts</span>
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="flex-1 data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none py-3 gap-1.5"
            >
              <Bookmark className="h-3 w-3" />
              <span className="text-xs font-semibold uppercase tracking-wider">Saved</span>
            </TabsTrigger>
            <TabsTrigger
              value="tagged"
              className="flex-1 data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none py-3 gap-1.5"
            >
              <Tag className="h-3 w-3" />
              <span className="text-xs font-semibold uppercase tracking-wider">Tagged</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0 pt-7">
            <div className="grid grid-cols-3 gap-1 md:gap-7">
              {/* Empty state */}
              <div className="col-span-3 flex flex-col items-center justify-center py-16">
                <div className="rounded-full border-2 border-foreground p-8 mb-6">
                  <Grid className="h-16 w-16" strokeWidth={1} />
                </div>
                <h3 className="text-3xl font-light mb-2">Share Photos</h3>
                <p className="text-sm text-muted-foreground">When you share photos, they will appear on your profile.</p>
                <Button variant="link" className="text-primary font-semibold mt-2">
                  Share your first photo
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-0 pt-7">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full border-2 border-foreground p-8 mb-6">
                <Bookmark className="h-16 w-16" strokeWidth={1} />
              </div>
              <h3 className="text-3xl font-light mb-2">Save</h3>
              <p className="text-sm text-muted-foreground">Save photos and videos that you want to see again.</p>
            </div>
          </TabsContent>

          <TabsContent value="tagged" className="mt-0 pt-7">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full border-2 border-foreground p-8 mb-6">
                <Tag className="h-16 w-16" strokeWidth={1} />
              </div>
              <h3 className="text-3xl font-light mb-2">Photos of you</h3>
              <p className="text-sm text-muted-foreground">When people tag you in photos, they'll appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

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
