import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, ImageIcon, Globe, Lock, Trash2, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  getMyStoryboards, 
  deleteStoryboard,
  type Storyboard 
} from "@/services/storyboardsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Header } from "@/components/Header";
import { toast } from "sonner";

export default function MyStoryboardsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
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
    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    
    try {
      await deleteStoryboard(id);
      toast.success("Storyboard deleted");
      setStoryboards(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete storyboard");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-muted-foreground">
            Please sign in to view your storyboards.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              My Visual Storyboards
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-2xl">
              Collect inspiration from creators, agents, and the Creator Lab. 
              Build your perfect trip visually, then convert to a Trip Request when ready.
            </p>
          </div>
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => navigate("/storyboards/new")}
          >
            <Plus className="mr-1 h-4 w-4" />
            New Storyboard
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-48 animate-pulse bg-muted/40" />
            ))}
          </div>
        ) : storyboards.length === 0 ? (
          <Card className="mt-4 border-dashed border-border bg-muted/20">
            <CardContent className="flex flex-col items-start gap-4 py-8 px-6">
              <div className="space-y-2">
                <p className="font-medium text-foreground">No storyboards yet</p>
                <p className="text-xs text-muted-foreground max-w-md">
                  Start collecting travel inspiration! Save content from the Creator Lab, 
                  creator profiles, or agent recommendations to build your dream trip visually.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => navigate("/creator-lab")}
                >
                  Open Creator Lab
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => navigate("/creators")}
                >
                  Browse Creators
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {storyboards.map((board) => (
              <Card
                key={board.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-lg"
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/storyboards/${board.id}`)}
                >
                  <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-muted to-muted/40">
                    {board.cover_image_url ? (
                      <img
                        src={board.cover_image_url}
                        alt={board.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                        {board.is_public ? (
                          <><Globe className="h-2.5 w-2.5" /> Public</>
                        ) : (
                          <><Lock className="h-2.5 w-2.5" /> Private</>
                        )}
                      </span>
                      {board.trip_request_id && (
                        <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-medium text-white">
                          Converted
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3">
                      <span className="text-xs font-medium text-white/90">
                        {board.items_count || 0} items
                      </span>
                    </div>
                  </div>
                  
                  <CardContent className="space-y-1.5 p-4">
                    <h3 className="line-clamp-1 text-sm font-medium text-foreground">
                      {board.title}
                    </h3>
                    {board.description && (
                      <p className="line-clamp-2 text-[11px] text-muted-foreground">
                        {board.description}
                      </p>
                    )}
                  </CardContent>
                </div>

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
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/storyboards/${board.id}`);
                        }}
                      >
                        View & Edit
                      </DropdownMenuItem>
                      {!board.trip_request_id && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/post-trip?fromStoryboard=${board.id}`);
                          }}
                        >
                          Convert to Trip Request
                        </DropdownMenuItem>
                      )}
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
