import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface UseGroupTripRealtimeProps {
  tripId: string;
  onSuggestionAdded?: () => void;
  onVoteChanged?: () => void;
}

export const useGroupTripRealtime = ({
  tripId,
  onSuggestionAdded,
  onVoteChanged,
}: UseGroupTripRealtimeProps) => {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!tripId || !user) return;

    // Subscribe to new suggestions
    const suggestionsChannel = supabase
      .channel(`trip_suggestions_${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_suggestions',
          filter: `trip_id=eq.${tripId}`,
        },
        async (payload) => {
          const newSuggestion = payload.new as any;
          
          // Don't notify user about their own suggestions
          if (newSuggestion.suggested_by === user.id) return;

          // Fetch username of the person who added the suggestion
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', newSuggestion.suggested_by)
            .single();

          toast({
            title: 'New Suggestion',
            description: `${profile?.username || 'Someone'} added a ${newSuggestion.suggestion_type}: ${newSuggestion.title}`,
          });

          if (onSuggestionAdded) {
            onSuggestionAdded();
          }
        }
      )
      .subscribe();

    // Subscribe to votes
    const votesChannel = supabase
      .channel(`trip_votes_${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_votes',
        },
        async (payload) => {
          const vote = payload.new as any;
          
          // Don't notify user about their own votes
          if (vote.user_id === user.id) return;

          // Get the suggestion details
          const { data: suggestion } = await supabase
            .from('trip_suggestions')
            .select('trip_id, title')
            .eq('id', vote.suggestion_id)
            .single();

          // Only notify if this vote is for the current trip
          if (suggestion?.trip_id !== tripId) return;

          // Fetch username of the voter
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', vote.user_id)
            .single();

          const voteEmoji = vote.vote_type === 'upvote' ? '👍' : '👎';
          
          toast({
            title: 'New Vote',
            description: `${profile?.username || 'Someone'} ${voteEmoji} "${suggestion?.title}"`,
          });

          if (onVoteChanged) {
            onVoteChanged();
          }
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(suggestionsChannel);
      supabase.removeChannel(votesChannel);
    };
  }, [tripId, user, onSuggestionAdded, onVoteChanged, toast]);
};