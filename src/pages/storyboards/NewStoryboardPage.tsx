import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createStoryboard } from "@/services/storyboardsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Header } from "@/components/Header";
import { toast } from "sonner";

export default function NewStoryboardPage() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        navigate("/auth?returnTo=/storyboards/new", { replace: true });
        return;
      }
      setUser(authUser);
    })();
  }, [navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !title.trim()) {
      toast.error("Please enter a title for your storyboard");
      return;
    }
    
    setCreating(true);
    try {
      const board = await createStoryboard({
        ownerId: user.id,
        role: "traveler",
        title: title.trim(),
        description: description.trim() || undefined,
        isPublic: visibility === "public",
      });
      
      toast.success("Storyboard created!");
      navigate(`/storyboards/${board.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create storyboard");
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-muted-foreground">
            Please sign in to create a storyboard.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <button
          onClick={() => navigate("/storyboards")}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition mb-6"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to storyboards
        </button>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Create New Storyboard
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Start collecting travel inspiration for your next luxury adventure.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Dream Safari Adventure"
                maxLength={100}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Give your storyboard a memorable name
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A collection of luxury safari experiences, boutique lodges, and wildlife encounters..."
                rows={3}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                Optional: Describe what kind of trip you're planning
              </p>
            </div>

            <div className="space-y-3">
              <Label>Visibility</Label>
              <RadioGroup value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                <div className="flex items-start space-x-3 rounded-lg border border-border p-4">
                  <RadioGroupItem value="private" id="private" className="mt-0.5" />
                  <label htmlFor="private" className="flex-1 cursor-pointer space-y-1">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium">Private</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Only you can view and edit this storyboard
                    </p>
                  </label>
                </div>
                
                <div className="flex items-start space-x-3 rounded-lg border border-border p-4">
                  <RadioGroupItem value="public" id="public" className="mt-0.5" />
                  <label htmlFor="public" className="flex-1 cursor-pointer space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium">Public</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Anyone can view this storyboard (great for sharing with travel companions)
                    </p>
                  </label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={creating || !title.trim()}
                className="flex-1"
              >
                {creating ? "Creating..." : "Create Storyboard"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/storyboards")}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
