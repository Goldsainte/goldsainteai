import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

interface Invite {
  id: string;
  post_id: string;
  invited_by: string;
  invited_at: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  };
  travel_posts: {
    caption: string | null;
    thumbnail_url: string | null;
  };
}

interface CollaborationInvitesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const CollaborationInvites = ({ 
  open, 
  onOpenChange,
  onUpdate 
}: CollaborationInvitesProps) => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      fetchInvites();
    }
  }, [open, user]);

  const fetchInvites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('post_collaborators')
        .select(`
          id,
          post_id,
          invited_by,
          invited_at,
          travel_posts (
            caption,
            thumbnail_url
          )
        `)
        .eq('collaborator_id', user.id)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });

      if (error) throw error;
      
      // Fetch inviter profiles separately
      if (data && data.length > 0) {
        const inviterIds = data.map(inv => inv.invited_by);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', inviterIds);
        
        // Merge profiles with invites
        const enrichedInvites = data.map(invite => ({
          ...invite,
          profiles: profiles?.find(p => p.id === invite.invited_by) || {
            username: null,
            avatar_url: null,
          },
        }));
        
        setInvites(enrichedInvites);
      } else {
        setInvites([]);
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
      toast.error('Failed to load invites');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (inviteId: string, accept: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('post_collaborators')
        .update({
          status: accept ? 'accepted' : 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', inviteId);

      if (error) throw error;

      toast.success(accept ? 'Collaboration accepted!' : 'Collaboration declined');
      
      // Remove from local state
      setInvites(invites.filter(inv => inv.id !== inviteId));
      onUpdate();
    } catch (error) {
      console.error('Error responding to invite:', error);
      toast.error('Failed to respond to invite');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Collaboration Invites</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading invites...</p>
          ) : invites.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pending invites</p>
            </div>
          ) : (
            invites.map(invite => (
              <div
                key={invite.id}
                className="border rounded-lg p-4 space-y-3"
              >
                {/* Inviter */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={invite.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      {invite.profiles.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {invite.profiles.username || 'Someone'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      invited you to collaborate
                    </p>
                  </div>
                </div>

                {/* Post Preview */}
                {invite.travel_posts.thumbnail_url && (
                  <img
                    src={invite.travel_posts.thumbnail_url}
                    alt="Post preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                
                {invite.travel_posts.caption && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {invite.travel_posts.caption}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRespond(invite.id, true)}
                    className="flex-1"
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleRespond(invite.id, false)}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
