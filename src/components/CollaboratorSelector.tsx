import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface CollaboratorSelectorProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CollaboratorSelector = ({ postId, open, onOpenChange }: CollaboratorSelectorProps) => {
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && search.length > 0) {
      searchProfiles();
    }
  }, [search, open]);

  const searchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .ilike("username", `%${search}%`)
      .limit(10);

    if (error) {
      console.error("Error searching profiles:", error);
      return;
    }

    setProfiles(data || []);
  };

  const toggleCollaborator = (userId: string) => {
    setSelectedCollaborators((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const inviteCollaborators = async () => {
    if (selectedCollaborators.length === 0) {
      toast.error("Please select at least one collaborator");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const invites = selectedCollaborators.map((collaboratorId) => ({
      post_id: postId,
      collaborator_id: collaboratorId,
      invited_by: user.id,
    }));

    const { error } = await supabase
      .from("post_collaborators")
      .insert(invites);

    setLoading(false);

    if (error) {
      toast.error("Failed to send invitations");
      console.error(error);
      return;
    }

    toast.success(`Invited ${selectedCollaborators.length} collaborator(s)`);
    setSelectedCollaborators([]);
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Collaborators</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ScrollArea className="h-[300px]">
            {profiles.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {search.length === 0 ? "Start typing to search" : "No users found"}
              </p>
            ) : (
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent"
                    onClick={() => toggleCollaborator(profile.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>{profile.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">@{profile.username}</span>
                    </div>
                    {selectedCollaborators.includes(profile.id) && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <Button
            onClick={inviteCollaborators}
            disabled={loading || selectedCollaborators.length === 0}
            className="w-full"
          >
            Invite {selectedCollaborators.length > 0 && `(${selectedCollaborators.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
