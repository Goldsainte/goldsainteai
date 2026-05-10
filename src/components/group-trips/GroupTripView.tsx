import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, DollarSign, ThumbsUp, ThumbsDown, Loader2, Plus, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupTripRealtime } from '@/hooks/useGroupTripRealtime';
import { AddSuggestionDialog } from './AddSuggestionDialog';
import { InviteMembersDialog } from './InviteMembersDialog';
import { TripChat } from './TripChat';
import { BudgetTracker } from './BudgetTracker';
import { PersonalExpenseTracker } from './PersonalExpenseTracker';
import { ExportTripButton } from './ExportTripButton';
import { TripSettings } from './TripSettings';
import { TripTimeline } from './TripTimeline';
import { WeatherForecast } from './WeatherForecast';
import { CurrencyConverter } from './CurrencyConverter';
import confetti from 'canvas-confetti';

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
  const [participants, setParticipants] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const previousSuggestionsRef = useRef<any[]>([]);

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

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('suggestion_participants')
        .select('*')
        .eq('trip_id', tripId);

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

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
      checkMilestones(processedSuggestions);
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

  const checkMilestones = (newSuggestions: any[]) => {
    if (previousSuggestionsRef.current.length === 0) {
      previousSuggestionsRef.current = newSuggestions;
      return;
    }

    const acceptedMembersCount = members.filter(m => m.status === 'accepted').length;

    newSuggestions.forEach((suggestion) => {
      const previousSuggestion = previousSuggestionsRef.current.find(s => s.id === suggestion.id);
      
      if (!previousSuggestion) return;

      const previousUpvotes = previousSuggestion.upvotes || 0;
      const currentUpvotes = suggestion.upvotes || 0;

      // Check for 5 upvotes milestone
      if (previousUpvotes < 5 && currentUpvotes >= 5) {
        triggerCelebration('popular');
        toast({
          title: '🎉 Popular Choice!',
          description: `"${suggestion.title}" reached 5 upvotes!`,
        });
      }

      // Check for unanimous approval (all members voted)
      if (acceptedMembersCount > 1 && currentUpvotes === acceptedMembersCount && suggestion.downvotes === 0) {
        if (previousUpvotes !== acceptedMembersCount) {
          triggerCelebration('unanimous');
          toast({
            title: '🌟 Unanimous Approval!',
            description: `Everyone loves "${suggestion.title}"!`,
          });
        }
      }
    });

    previousSuggestionsRef.current = newSuggestions;
  };

  const triggerCelebration = (type: 'popular' | 'unanimous') => {
    if (type === 'unanimous') {
      // Golden confetti for unanimous
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF8C00'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF8C00'],
        });
      }, 250);
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF8C00'],
        });
      }, 400);
    } else {
      // Colorful confetti for popular
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  // Set up realtime subscriptions
  useGroupTripRealtime({
    tripId,
    onSuggestionAdded: fetchTripData,
    onVoteChanged: fetchTripData,
  });

  // Subscribe to participant changes
  useEffect(() => {
    const channel = supabase
      .channel('participant-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'suggestion_participants',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          fetchTripData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  useEffect(() => {
    if (tripId) {
      fetchTripData();
    }
  }, [tripId]);

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

  const handleParticipationToggle = async (suggestionId: string, currentStatus: string | null) => {
    if (!user) return;

    try {
      if (!currentStatus) {
        // Add participation
        const { error } = await supabase
          .from('suggestion_participants')
          .insert([{
            suggestion_id: suggestionId,
            user_id: user.id,
            trip_id: tripId,
            status: 'interested',
          }] as any);

        if (error) throw error;
      } else {
        // Cycle through statuses: interested -> confirmed -> declined -> remove
        const statusCycle: Record<string, string | null> = {
          'interested': 'confirmed',
          'confirmed': 'declined',
          'declined': null,
        };

        const nextStatus = statusCycle[currentStatus];

        if (nextStatus === null) {
          // Remove participation
          const { error } = await supabase
            .from('suggestion_participants')
            .delete()
            .eq('suggestion_id', suggestionId)
            .eq('user_id', user.id);

          if (error) throw error;
        } else {
          // Update status
          const { error } = await supabase
            .from('suggestion_participants')
            .update({ status: nextStatus } as any)
            .eq('suggestion_id', suggestionId)
            .eq('user_id', user.id);

          if (error) throw error;
        }
      }

      // Refresh data
      fetchTripData();
    } catch (error: any) {
      console.error('Error updating participation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update participation',
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
  const isAdmin = members.some(m => m.user_id === user?.id && m.status === 'accepted' && m.role === 'admin');

  if (showSettings) {
    return (
      <TripSettings
        trip={trip}
        members={members}
        onClose={() => setShowSettings(false)}
        onUpdate={fetchTripData}
      />
    );
  }

  const renderSuggestionCard = (suggestion: any) => {
    const acceptedMembersCount = members.filter(m => m.status === 'accepted').length;
    const isUnanimous = acceptedMembersCount > 1 && 
                        suggestion.upvotes === acceptedMembersCount && 
                        suggestion.downvotes === 0;
    const isPopular = suggestion.upvotes >= 5;

    const userParticipation = participants.find(
      p => p.suggestion_id === suggestion.id && p.user_id === user?.id
    );
    const participantCount = participants.filter(
      p => p.suggestion_id === suggestion.id && p.status !== 'declined'
    ).length;
    const splitCost = suggestion.price && participantCount > 0 
      ? suggestion.price / participantCount 
      : suggestion.price;

    const participationButtonText = !userParticipation 
      ? "I'm Interested" 
      : userParticipation.status === 'interested' 
      ? 'Confirm' 
      : userParticipation.status === 'confirmed'
      ? 'Decline'
      : 'Removed';

    const participationButtonVariant = !userParticipation 
      ? 'outline' 
      : userParticipation.status === 'interested' 
      ? 'secondary' 
      : userParticipation.status === 'confirmed'
      ? 'default'
      : 'destructive';

    return (
      <Card key={suggestion.id} className={isUnanimous ? 'border-yellow-500 shadow-lg animate-pulse' : isPopular ? 'border-primary shadow-md' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                {isUnanimous && <Badge variant="default" className="bg-[#C7A962] text-white">⭐ Unanimous</Badge>}
                {isPopular && !isUnanimous && <Badge variant="secondary">🔥 Popular</Badge>}
              </div>
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
            <span>
              ${suggestion.price.toFixed(2)}
              {participantCount > 0 && (
                <span className="ml-2 text-xs">
                  (${splitCost.toFixed(2)}/person with {participantCount} {participantCount === 1 ? 'participant' : 'participants'})
                </span>
              )}
            </span>
          </div>
        )}

        {suggestion.price && isMember && (
          <Button
            size="sm"
            variant={participationButtonVariant}
            onClick={() => handleParticipationToggle(suggestion.id, userParticipation?.status || null)}
            className="w-full"
          >
            <Users className="h-4 w-4 mr-2" />
            {participationButtonText}
            {userParticipation && userParticipation.status !== 'declined' && (
              <Badge variant="outline" className="ml-2">
                ${splitCost.toFixed(2)}
              </Badge>
            )}
          </Button>
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
  };

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

      <div className="flex gap-2 flex-wrap">
        {isMember && <AddSuggestionDialog tripId={tripId} tripStartDate={trip.start_date} onSuggestionAdded={fetchTripData} />}
        {isCreator && <InviteMembersDialog tripId={tripId} onMembersAdded={fetchTripData} />}
        <ExportTripButton 
          trip={trip}
          suggestions={suggestions}
          members={members}
          participants={participants}
        />
        {isCreator && (
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {isMember && (
          <PersonalExpenseTracker 
            suggestions={suggestions}
            participants={participants}
            userId={user?.id || ''}
            budgetPerPerson={trip.budget_per_person}
          />
        )}
        <BudgetTracker 
          suggestions={suggestions} 
          members={members}
          budgetPerPerson={trip.budget_per_person}
        />
      </div>

      <WeatherForecast tripId={tripId} />

      <CurrencyConverter suggestions={suggestions} />

      {isMember && <TripChat tripId={tripId} members={members} />}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
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

        <TabsContent value="timeline" className="mt-4">
          <TripTimeline
            trip={trip}
            suggestions={suggestions}
            members={members}
            participants={participants}
            onUpdate={fetchTripData}
          />
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