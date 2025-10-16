import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon, ChevronLeft, MapPin, Loader2, X } from "lucide-react";
import { InstagramVerifiedBadge } from "@/components/badges/InstagramVerifiedBadge";
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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      performSearch(q);
    }
    
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
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
      
      // Save to recent searches
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const removeRecentSearch = (search: string) => {
    const updated = recentSearches.filter(s => s !== search);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar - Instagram Style */}
      <div className="w-full md:w-96 border-r border-border bg-background flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/travel-feed')}
              className="hover:bg-accent"
              aria-label="Back"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold">Search</h1>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="pl-10 bg-muted"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Recent Searches / Results */}
        <div className="flex-1 overflow-y-auto">
          {!query && recentSearches.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent</h2>
                <Button
                  variant="link"
                  size="sm"
                  onClick={clearRecentSearches}
                  className="text-blue-500 p-0 h-auto"
                >
                  Clear all
                </Button>
              </div>
              <div className="space-y-2">
                {recentSearches.map((search, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 hover:bg-accent rounded-lg px-2 cursor-pointer"
                    onClick={() => {
                      setQuery(search);
                      setSearchParams({ q: search });
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <SearchIcon className="h-5 w-5 text-muted-foreground" />
                      <span>{search}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentSearch(search);
                      }}
                      className="hover:opacity-70"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!query && recentSearches.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center px-4">
                No recent searches.
              </p>
            </div>
          )}

          {query && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-2 sticky top-0 bg-background z-10 border-b rounded-none h-12">
                <TabsTrigger value="users" className="rounded-none">
                  Users
                </TabsTrigger>
                <TabsTrigger value="posts" className="rounded-none">
                  Videos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="p-4 space-y-2 m-0">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    No users found
                  </p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => navigate(`/travel-profile/${user.id}`)}
                      className="flex items-center gap-3 p-2 cursor-pointer hover:bg-accent rounded-lg transition-colors"
                    >
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">
                            {user.username || "Anonymous"}
                          </p>
                          {user.is_verified && <InstagramVerifiedBadge />}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.full_name}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="posts" className="p-4 m-0">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : posts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    No videos found
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => navigate(`/travel-feed?postId=${post.id}`)}
                        className="aspect-square cursor-pointer hover:opacity-80 transition-opacity relative overflow-hidden rounded"
                      >
                        {post.thumbnail_url && (
                          <img
                            src={post.thumbnail_url}
                            alt={post.caption || "Video"}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Right Content Area - Empty for Instagram style */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-muted/20">
        <div className="text-center p-8">
          <SearchIcon className="h-24 w-24 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground">Search for people and videos</p>
        </div>
      </div>
    </div>
  );
}
