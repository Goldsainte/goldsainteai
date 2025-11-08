import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, DollarSign, ThumbsUp, ThumbsDown, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AddSuggestionDialog } from './AddSuggestionDialog';
import { InviteMembersDialog } from './InviteMembersDialog';

interface GroupTripViewProps {
  tripId: string;
}

export const GroupTripView = ({ tripId }: GroupTripViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [votes, setVotes] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    if (tripId) {
      fetchTripData();
    }
  }, [tripId]);

  const fetchTripData = async () => {
    try {
      setLoading(true);

      // Fetch trip details
      const { data: tripData, error: tripError } = await supabase
        .from('group_trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', tripId);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Fetch suggestions with vote counts
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from('trip_suggestions')
        .select(`
          *,
          trip_votes (
            vote_type,
            user_id
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (suggestionsError) throw suggestionsError;
      
      // Process suggestions with vote counts
      const processedSuggestions = (suggestionsData || []).map((suggestion: any) => {
        const upvotes = suggestion.trip_votes?.filter((v: any) => v.vote_type === 'upvote').length || 0;
        const downvotes = suggestion.trip_votes?.filter((v: any) => v.vote_type === 'downvote').length || 0;
        const userVote = suggestion.trip_votes?.find((v: any) => v.user_id === user?.id);
        
        return {
          ...suggestion,
          upvotes,
          downvotes,
          userVote: userVote?.vote_type,
        };
      });

      setSuggestions(processedSuggestions);
    } catch (error: any) {
      console.error('Error fetching trip data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trip data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (suggestionId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) return;

    try {
      const suggestion = suggestions.find(s => s.id === suggestionId);
      
      // If user already voted this way, remove the vote
      if (suggestion?.userVote === voteType) {
        const { error } = await supabase
          .from('trip_votes')
          .delete()
          .eq('suggestion_id', suggestionId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Upsert the vote
        const { error } = await supabase
          .from('trip_votes')
          .upsert({
            suggestion_id: suggestionId,
            user_id: user.id,
            vote_type: voteType,
          }, {
            onConflict: 'suggestion_id,user_id'
          });

        if (error) throw error;
      }

      // Refresh data
      fetchTripData();
    } catch (error: any) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to cast vote',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!trip) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-center text-muted-foreground">Trip not found</p>
        </CardContent>
      </Card>
    );
  }

  const isCreator = trip.creator_id === user?.id;
  const isMember = members.some(m => m.user_id === user?.id && m.status === 'accepted');

  const renderSuggestionCard = (suggestion: any) => (
    <Card key={suggestion.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{suggestion.title}</CardTitle>
            <CardDescription>{suggestion.description}</CardDescription>
          </div>
          <Badge>{suggestion.suggestion_type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestion.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{suggestion.location}</span>
          </div>
        )}
        
        {suggestion.price && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>${suggestion.price.toFixed(2)}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant={suggestion.userVote === 'upvote' ? 'default' : 'outline'}
            onClick={() => handleVote(suggestion.id, 'upvote')}
            disabled={!isMember}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            {suggestion.upvotes}
          </Button>
          <Button
            size="sm"
            variant={suggestion.userVote === 'downvote' ? 'destructive' : 'outline'}
            onClick={() => handleVote(suggestion.id, 'downvote')}
            disabled={!isMember}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            {suggestion.downvotes}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{trip.title}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {trip.destination}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {members.filter(m => m.status === 'accepted').length} members
                </span>
              </CardDescription>
            </div>
            <Badge variant={trip.status === 'planning' ? 'secondary' : 'default'}>
              {trip.status}
            </Badge>
          </div>
        </CardHeader>
        {trip.description && (
          <CardContent>
            <p className="text-muted-foreground">{trip.description}</p>
            {trip.budget_per_person && (
              <p className="mt-2 text-sm flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Budget: ${trip.budget_per_person.toFixed(2)} per person
              </p>
            )}
          </CardContent>
        )}
      </Card>

      <div className="flex gap-2">
        {isMember && <AddSuggestionDialog tripId={tripId} onSuggestionAdded={fetchTripData} />}
        {isCreator && <InviteMembersDialog tripId={tripId} onMembersAdded={fetchTripData} />}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="hotel">Hotels</TabsTrigger>
          <TabsTrigger value="activity">Activities</TabsTrigger>
          <TabsTrigger value="restaurant">Restaurants</TabsTrigger>
          <TabsTrigger value="flight">Flights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-4">
          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <p className="text-center text-muted-foreground">
                  No suggestions yet. Be the first to add one!
                </p>
              </CardContent>
            </Card>
          ) : (
            suggestions.map(renderSuggestionCard)
          )}
        </TabsContent>
        
        {['hotel', 'activity', 'restaurant', 'flight'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4 mt-4">
            {suggestions.filter(s => s.suggestion_type === type).length === 0 ? (
              <Card>
                <CardContent className="py-10">
                  <p className="text-center text-muted-foreground">
                    No {type} suggestions yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              suggestions
                .filter(s => s.suggestion_type === type)
                .map(renderSuggestionCard)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};