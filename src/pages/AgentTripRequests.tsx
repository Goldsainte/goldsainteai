import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Users, DollarSign, Calendar } from 'lucide-react';
import { Header } from '@/components/Header';

interface TripRequest {
  id: string;
  user_id: string;
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
}

export default function AgentTripRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<TripRequest[]>([]);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [quotingRequest, setQuotingRequest] = useState<string | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteDetails, setQuoteDetails] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAgentProfile();
  }, [user, navigate]);

  const fetchAgentProfile = async () => {
    try {
      const { data: agent, error } = await supabase
        .from('travel_agents')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!agent) {
        toast({ title: 'You must be a registered agent to access this page', variant: 'destructive' });
        navigate('/');
        return;
      }

      setAgentId(agent.id);
      fetchRequests(agent.id);
    } catch (error: any) {
      console.error('Error fetching agent:', error);
      toast({ title: 'Error loading agent profile', variant: 'destructive' });
    }
  };

  const fetchRequests = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('cocurated_trip_requests')
        .select('*')
        .or(`status.eq.pending,assigned_agent_id.eq.${agentId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast({ title: 'Error loading trip requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('cocurated_trip_requests')
        .update({ 
          assigned_agent_id: agentId,
          status: 'assigned'
        })
        .eq('id', requestId);

      if (error) throw error;
      
      toast({ title: 'Request claimed successfully' });
      fetchRequests(agentId!);
    } catch (error: any) {
      console.error('Error claiming request:', error);
      toast({ title: 'Failed to claim request', variant: 'destructive' });
    }
  };

  const handleSubmitQuote = async (requestId: string) => {
    if (!quotePrice || !quoteDetails) {
      toast({ title: 'Please enter both price and details', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('cocurated_trip_requests')
        .update({ 
          quoted_price: parseFloat(quotePrice),
          quoted_details: quoteDetails,
          status: 'quoted'
        })
        .eq('id', requestId);

      if (error) throw error;
      
      toast({ title: 'Quote submitted successfully' });
      setQuotingRequest(null);
      setQuotePrice('');
      setQuoteDetails('');
      fetchRequests(agentId!);
    } catch (error: any) {
      console.error('Error submitting quote:', error);
      toast({ title: 'Failed to submit quote', variant: 'destructive' });
    }
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
          <h1 className="text-4xl font-bold mb-2">Custom Trip Requests</h1>
          <p className="text-muted-foreground">
            Review and quote on custom trip requests from guests
          </p>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No trip requests available at the moment
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Custom Trip Request
                        <Badge variant={request.status === 'pending' ? 'default' : 'secondary'}>
                          {request.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Requested {new Date(request.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{request.total_travelers} travelers</span>
                    </div>
                    {request.budget_range_min && request.budget_range_max && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          Budget: ${request.budget_range_min} - ${request.budget_range_max}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Requested Items:</h4>
                    <div className="space-y-2">
                      {request.trip_items.map((item: any, idx: number) => (
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
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {request.special_requests && (
                    <div>
                      <h4 className="font-semibold mb-1">Special Requests:</h4>
                      <p className="text-sm text-muted-foreground">{request.special_requests}</p>
                    </div>
                  )}

                  {quotingRequest === request.id && (
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-semibold">Submit Your Quote:</h4>
                      <Input
                        type="number"
                        placeholder="Total Price"
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(e.target.value)}
                      />
                      <Textarea
                        placeholder="Quote details (what's included, timeline, etc.)"
                        value={quoteDetails}
                        onChange={(e) => setQuoteDetails(e.target.value)}
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => handleSubmitQuote(request.id)}>
                          Submit Quote
                        </Button>
                        <Button variant="outline" onClick={() => setQuotingRequest(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {request.status === 'pending' && !request.assigned_agent_id && (
                    <Button onClick={() => handleClaimRequest(request.id)} className="w-full">
                      Claim & Quote
                    </Button>
                  )}
                  {request.assigned_agent_id === agentId && request.status === 'assigned' && quotingRequest !== request.id && (
                    <Button onClick={() => setQuotingRequest(request.id)} className="w-full">
                      Provide Quote
                    </Button>
                  )}
                  {request.status === 'quoted' && (
                    <div className="w-full text-center text-sm text-muted-foreground">
                      Quote submitted: ${request.quoted_price?.toFixed(2)}
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}