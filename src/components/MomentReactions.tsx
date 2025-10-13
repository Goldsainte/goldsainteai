import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MomentReaction } from "@/types/phase9";

interface MomentReactionsProps {
  momentId: string;
  className?: string;
}

const REACTIONS = ['❤️', '🔥', '😂', '😮', '😢', '👏'];

export const MomentReactions = ({ momentId, className = '' }: MomentReactionsProps) => {
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchReactions();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel(`moment_reactions:${momentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'moment_reactions',
        filter: `moment_id=eq.${momentId}`,
      }, () => {
        fetchReactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [momentId]);

  const fetchReactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get all reactions for this moment
      const { data, error } = await supabase
        .from('moment_reactions' as any)
        .select('reaction, user_id')
        .eq('moment_id', momentId);

      if (error) throw error;

      // Count reactions
      const counts: Record<string, number> = {};
      const reactions = (data as unknown as MomentReaction[]) || [];
      reactions.forEach(r => {
        counts[r.reaction] = (counts[r.reaction] || 0) + 1;
        if (user && r.user_id === user.id) {
          setUserReaction(r.reaction);
        }
      });
      
      setReactionCounts(counts);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleReaction = async (reaction: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to react");
        return;
      }

      if (userReaction === reaction) {
        // Remove reaction
        await supabase
          .from('moment_reactions' as any)
          .delete()
          .eq('moment_id', momentId)
          .eq('user_id', user.id);
        
        setUserReaction(null);
      } else {
        // Add or update reaction
        await supabase
          .from('moment_reactions' as any)
          .upsert({
            moment_id: momentId,
            user_id: user.id,
            reaction,
          } as any, {
            onConflict: 'moment_id,user_id',
          });
        
        setUserReaction(reaction);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error("Failed to add reaction");
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {REACTIONS.map(reaction => (
        <Button
          key={reaction}
          variant={userReaction === reaction ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleReaction(reaction)}
          className="text-2xl p-2 h-auto bg-white/10 hover:bg-white/20"
        >
          {reaction}
          {reactionCounts[reaction] > 0 && (
            <span className="ml-1 text-xs">{reactionCounts[reaction]}</span>
          )}
        </Button>
      ))}
    </div>
  );
};