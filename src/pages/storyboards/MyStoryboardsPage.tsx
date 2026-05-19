import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ImageIcon, Globe, Lock, Trash2, MoreVertical, Sparkles, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  getMyStoryboards, 
  deleteStoryboard,
  type Storyboard 
} from "@/services/storyboardsService";
import { Button } from "@/components/ui/button";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/ui/BackButton";
import { toast } from "sonner";

export default function MyStoryboardsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoryboards();
  }, []);

  const loadStoryboards = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        navigate("/auth?returnTo=/storyboards", { replace: true });
        return;
      }
      setUser(authUser);
      
      // Fetch account type for smart back navigation
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", authUser.id)
        .single();
      
      setAccountType(profile?.account_type || null);
      
      const data = await getMyStoryboards(authUser.id);
      setStoryboards(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load storyboards");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStoryboard = async (id: string, title: string) => {
    const ok = await confirmDialog({
      title: `Delete "${title}"?`,
      description: "This action cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;
    
    try {
      await deleteStoryboard(id);
      toast.success("Storyboard deleted");
      setStoryboards(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete storyboard");
    }
  };

  // Smart back destination based on user role
  const getBackDestination = () => {
    switch (accountType) {
      case "creator":
        return "/creator-dashboard";
      case "agent":
        return "/agent-dashboard";
      case "traveler":
        return "/traveler";
      default:
        return "/";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDF9F0]">
        <Header />
        <main className="container mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-[#6B7280]">
            Please sign in to view your storyboards.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Back Button */}
        <BackButton 
          to={getBackDestination()} 
          label="Back to Dashboard" 
        />

        {/* Gold accent line */}
        <div className="w-16 h-0.5 bg-[#C7A962]" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-secondary text-[#0a2225] tracking-tight">
              My Visual Storyboards
            </h1>
            <p className="mt-2 text-sm text-[#6B7280] max-w-2xl leading-relaxed">
              Collect inspiration from creators, agents, and the Creator Lab. 
              Build your perfect trip visually, then convert to a Trip Request when ready.
            </p>
          </div>
          <Button
            size="sm"
            className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white"
            onClick={() => navigate("/storyboards/new")}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Storyboard
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card 
                key={i} 
                className="h-52 animate-pulse bg-white/60 border-[#E5DFC6] rounded-2xl" 
              />
            ))}
          </div>
        ) : storyboards.length === 0 ? (
          <Card className="mt-6 border-dashed border-[#E5DFC6] bg-white rounded-2xl">
            <CardContent className="flex flex-col items-center text-center gap-5 py-12 px-6">
              <div className="w-16 h-16 rounded-full bg-[#FDF9F0] flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-[#C7A962]" />
              </div>
              <div className="space-y-2">
                <p className="font-secondary text-xl text-[#0a2225]">No storyboards yet</p>
                <p className="text-sm text-[#6B7280] max-w-md leading-relaxed">
                  Start collecting travel inspiration! Save content from the Creator Lab, 
                  creator profiles, or agent recommendations to build your dream trip visually.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-[#E5DFC6] text-[#0a2225] hover:bg-[#FDF9F0]"
                  onClick={() => navigate("/storyboards/new")}
                >
                  Open Creator Lab
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-[#E5DFC6] text-[#0a2225] hover:bg-[#FDF9F0]"
                  onClick={() => navigate("/marketplace")}
                >
                  Explore Marketplace
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {storyboards.map((board) => (
              <Card
                key={board.id}
                className="group relative overflow-hidden rounded-2xl border border-[#E5DFC6] bg-white shadow-sm transition-all hover:shadow-lg hover:border-[#C7A962]/50"
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/storyboards/${board.id}`)}
                >
                  <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-[#FDF9F0] to-[#E5DFC6]/30">
                    {board.cover_image_url ? (
                      <img
                        src={board.cover_image_url}
                        alt={board.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"/>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-[#C7A962]/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                        {board.is_public ? (
                          <><Globe className="h-2.5 w-2.5" /> Public</>
                        ) : (
                          <><Lock className="h-2.5 w-2.5" /> Private</>
                        )}
                      </span>
                      {board.trip_request_id && (
                        <span className="rounded-full bg-[#C7A962] px-2.5 py-1 text-[10px] font-medium text-white">
                          Converted
                        </span>
                      )}
                    </div>

                    {/* Item count */}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-xs font-medium text-white/90">
                        {board.items_count || 0} items
                      </span>
                    </div>
                  </div>
                  
                  <CardContent className="space-y-1.5 p-4">
                    <h3 className="line-clamp-1 text-sm font-medium text-[#0a2225]">
                      {board.title}
                    </h3>
                    {board.description && (
                      <p className="line-clamp-2 text-xs text-[#6B7280]">
                        {board.description}
                      </p>
                    )}
                  </CardContent>
                </div>

                {/* Dropdown Menu */}
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-7 w-7 rounded-full bg-black/60 p-0 hover:bg-black/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3.5 w-3.5 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#E5DFC6]">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/storyboards/${board.id}`);
                        }}
                        className="text-[#0a2225]"
                      >
                        View & Edit
                      </DropdownMenuItem>
                      {!board.trip_request_id && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/post-trip?fromStoryboard=${board.id}`);
                          }}
                          className="text-[#0a2225]"
                        >
                          Convert to Trip Request
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/storyboards/${board.id}`);
                        }}
                        className="text-[#C7A962] font-medium"
                      >
                        <ShoppingBag className="mr-2 h-3.5 w-3.5" />
                        Sell This Experience
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStoryboard(board.id, board.title);
                        }}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
