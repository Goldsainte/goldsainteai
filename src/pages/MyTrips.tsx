import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Users, DollarSign, Edit } from 'lucide-react';
import { Header } from '@/components/Header';
import { EditTripRequestModal } from '@/components/EditTripRequestModal';

interface TripRequest {
  id: string;
  status: string;
  trip_items: any[];
  total_travelers: number;
  budget_range_min: number | null;
  budget_range_max: number | null;
  preferred_dates: any;
  special_requests: string | null;
  quoted_price: number | null;
  quoted_details: string | null;
  created_at: string;
  assigned_agent_id: string | null;
  additional_emails?: any;
  notify_all_emails?: boolean;
}

export default function MyTrips() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<TripRequest[]>([]);
  const [editingTrip, setEditingTrip] = useState<TripRequest | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchTrips();
  }, [user, navigate]);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('cocurated_trip_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching trips:', error);
      toast({ title: 'Error loading trips', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      assigned: 'bg-blue-500',
      quoted: 'bg-purple-500',
      booked: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Custom Trip Requests</h1>
          <p className="text-muted-foreground">
            View and manage your custom trip requests with Goldsainte agents
          </p>
        </div>

        {trips.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                You haven't created any custom trip requests yet
              </p>
              <Button onClick={() => navigate('/cocurated-marketplace')}>
                Browse Tours
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {trips.map((trip) => {
              const tripItems = Array.isArray(trip.trip_items) ? trip.trip_items : [];
              
              return (
                <Card key={trip.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Trip Request
                          <Badge className={getStatusColor(trip.status)}>
                            {trip.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Created {new Date(trip.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {(trip.status === 'pending' || trip.status === 'quoted' || trip.status === 'assigned') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTrip(trip)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{trip.total_travelers} travelers</span>
                      </div>
                      {trip.budget_range_min && trip.budget_range_max && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>
                            ${trip.budget_range_min} - ${trip.budget_range_max}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Trip Items:</h4>
                      <div className="space-y-2">
                        {tripItems.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.currency} {item.price} • {item.travelers} travelers
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {trip.special_requests && (
                      <div>
                        <h4 className="font-semibold mb-1">Special Requests:</h4>
                        <p className="text-sm text-muted-foreground">{trip.special_requests}</p>
                      </div>
                    )}

                    {trip.quoted_price && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Agent Quote:</h4>
                        <div className="bg-primary/10 p-4 rounded-lg">
                          <p className="text-2xl font-bold mb-2">
                            ${trip.quoted_price.toFixed(2)}
                          </p>
                          {trip.quoted_details && (
                            <p className="text-sm">{trip.quoted_details}</p>
                          )}
                          {trip.status === 'quoted' && (
                            <div className="flex gap-2 mt-4">
                              <Button>Accept Quote</Button>
                              <Button variant="outline">Request Changes</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {trip.status === 'pending' && !trip.assigned_agent_id && (
                      <p className="text-sm text-muted-foreground italic">
                        Waiting for an agent to review your request...
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {editingTrip && (
          <EditTripRequestModal
            open={!!editingTrip}
            onClose={() => setEditingTrip(null)}
            tripRequest={{
              id: editingTrip.id,
              destination: editingTrip.trip_items?.[0]?.name || '',
              total_travelers: editingTrip.total_travelers,
              budget_min: editingTrip.budget_range_min || 0,
              budget_max: editingTrip.budget_range_max || 0,
              special_requests: editingTrip.special_requests,
              additional_emails: editingTrip.additional_emails as any || [],
              notify_all_emails: editingTrip.notify_all_emails ?? true
            }}
            onSuccess={() => {
              setEditingTrip(null);
              fetchTrips();
            }}
          />
        )}
      </div>
    </div>
  );
}