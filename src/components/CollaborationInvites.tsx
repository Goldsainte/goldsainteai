import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, ChevronDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CollaborationInvite {
  id: string;
  post_id: string;
  invited_by: string;
  invited_at: string;
  inviter: {
    username: string;
    avatar_url: string | null;
  };
}

export const CollaborationInvites = () => {
  const [invites, setInvites] = useState<CollaborationInvite[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchInvites();

    // Subscribe to new invites
    const channel = supabase
      .channel('collaboration-invites')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_collaborators',
          filter: `collaborator_id=eq.${user.id}`,
        },
        () => fetchInvites()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchInvites = async () => {
    if (!user) return;

    const { data: invitesData, error } = await supabase
      .from("post_collaborators")
      .select(`
        id,
        post_id,
        invited_by,
        invited_at
      `)
      .eq("collaborator_id", user.id)
      .eq("status", "pending")
      .order("invited_at", { ascending: false });

    if (error) {
      console.error("Error fetching invites:", error);
      return;
    }

    // Fetch inviter profiles
    const inviterIds = invitesData?.map(inv => inv.invited_by) || [];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", inviterIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const formatted = invitesData?.map(invite => ({
      id: invite.id,
      post_id: invite.post_id,
      invited_by: invite.invited_by,
      invited_at: invite.invited_at,
      inviter: {
        username: profileMap.get(invite.invited_by)?.username || "Unknown",
        avatar_url: profileMap.get(invite.invited_by)?.avatar_url || null,
      }
    })) || [];

    setInvites(formatted);
  };

  const respondToInvite = async (inviteId: string, status: 'accepted' | 'declined') => {
    const { error } = await supabase
      .from("post_collaborators")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("id", inviteId);

    if (error) {
      toast.error(`Failed to ${status === 'accepted' ? 'accept' : 'decline'} invite`);
      console.error(error);
      return;
    }

    toast.success(`Collaboration ${status === 'accepted' ? 'accepted' : 'declined'}`);
    fetchInvites();
  };

  if (!user) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg transition-colors text-primary">
        <span className="text-sm font-medium">Collaboration Invites</span>
        {invites.length > 0 && (
          <Badge variant="destructive" className="ml-2">{invites.length}</Badge>
        )}
        {invites.length === 0 && (
          <Badge variant="secondary" className="ml-2">0</Badge>
        )}
        <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {invites.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pending invites</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={invite.inviter.avatar_url || undefined} />
                    <AvatarFallback>{invite.inviter.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">@{invite.inviter.username}</p>
                    <p className="text-xs text-muted-foreground">wants to collaborate</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => respondToInvite(invite.id, 'accepted')}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => respondToInvite(invite.id, 'declined')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
