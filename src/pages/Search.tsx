import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon, ChevronLeft, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { toast } from "sonner";

interface SearchUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
}

interface SearchPost {
  id: string;
  caption: string | null;
  location: string | null;
  thumbnail_url: string | null;
  like_count: number;
  view_count: number;
  profiles?: {
    username: string | null;
  };
}

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      setPosts([]);
      return;
    }

    setLoading(true);
    try {
      // Search users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, is_verified")
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
        .limit(20);

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Search posts by caption or location
      const { data: postsData, error: postsError } = await supabase
        .from("travel_posts")
        .select("id, caption, location, thumbnail_url, like_count, view_count, user_id")
        .or(`caption.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
        .limit(20);

      if (postsError) throw postsError;

      // Fetch profiles separately
      const postsWithProfiles = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", post.user_id)
            .maybeSingle();

          return {
            ...post,
            profiles: profile,
          };
        })
      );

      setPosts(postsWithProfiles);
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users, videos, locations..."
              className="pl-10"
              autoFocus
            />
          </div>
        </form>

        {/* Results Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">
              Users {users.length > 0 && `(${users.length})`}
            </TabsTrigger>
            <TabsTrigger value="posts">
              Videos {posts.length > 0 && `(${posts.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-2 mt-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                {query ? "No users found" : "Search for users"}
              </p>
            ) : (
              users.map((user) => (
                <Card
                  key={user.id}
                  onClick={() => navigate(`/travel-profile/${user.id}`)}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">
                          {user.full_name || user.username || "Anonymous"}
                        </p>
                        {user.is_verified && (
                          <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username || "user"}
                      </p>
                      {user.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-2 mt-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                {query ? "No videos found" : "Search for videos"}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {posts.map((post) => (
                  <Card
                    key={post.id}
                    onClick={() => navigate("/travel-feed")}
                    className="overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="aspect-[9/16] bg-muted relative">
                      {post.thumbnail_url && (
                        <img
                          src={post.thumbnail_url}
                          alt={post.caption || "Video"}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-xs line-clamp-2">
                          {post.caption}
                        </p>
                        {post.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-white" />
                            <p className="text-white text-xs truncate">{post.location}</p>
                          </div>
                        )}
                        <div className="flex gap-3 mt-1">
                          <span className="text-white text-xs">
                            ❤️ {post.like_count}
                          </span>
                          <span className="text-white text-xs">
                            👁️ {post.view_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
