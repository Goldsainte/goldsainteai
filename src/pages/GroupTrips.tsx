import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CreateGroupTripDialog } from '@/components/group-trips/CreateGroupTripDialog';
import { GroupTripView } from '@/components/group-trips/GroupTripView';
import { NotificationCenter } from '@/components/NotificationCenter';

const GroupTrips = () => {
  const { user } = useAuth();
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    if (user && !tripId) {
      fetchTrips();
    } else {
      setLoading(false);
    }
  }, [user, tripId]);

  const fetchTrips = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch trips where user is creator or member
      const { data, error } = await supabase
        .from('group_trips')
        .select(`
          *,
          trip_members!inner(user_id, status)
        `)
        .or(`creator_id.eq.${user.id},trip_members.user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTrips(data || []);
    } catch (error: any) {
      console.error('Error fetching trips:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trips',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">
              Please sign in to access group trips
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If viewing a specific trip
  if (tripId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() =>
              window.history.length > 1 ? navigate(-1) : navigate('/group-trips')
            }
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Trips
          </Button>
          <NotificationCenter />
        </div>
        <GroupTripView tripId={tripId} />
      </div>
    );
  }

  // List view
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Group Trips</h1>
          <p className="text-muted-foreground mt-2">
            Plan and vote on trips with friends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <CreateGroupTripDialog onTripCreated={(id) => navigate(`/group-trips/${id}`)} />
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : trips.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground mb-4">
              No group trips yet. Create one to get started!
            </p>
            <div className="flex justify-center">
              <CreateGroupTripDialog onTripCreated={(id) => navigate(`/group-trips/${id}`)} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Card
              key={trip.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/group-trips/${trip.id}`)}
            >
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-2">{trip.title}</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{trip.destination}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(trip.start_date), 'MMM d')} -{' '}
                      {format(new Date(trip.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      {trip.trip_members?.filter((m: any) => m.status === 'accepted').length || 0}{' '}
                      members
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupTrips;