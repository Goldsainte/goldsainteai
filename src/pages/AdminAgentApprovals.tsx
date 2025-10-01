import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SimpleHeader } from "@/components/SimpleHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Building2 } from "lucide-react";

interface PendingAgent {
  id: string;
  agency_name: string;
  primary_contact_name: string;
  email: string;
  phone: string;
  business_type: string;
  business_address: string;
  license_number?: string;
  accreditations?: string;
  experience_years?: number;
  specializations?: string[];
  destinations?: string[];
  bio?: string;
  is_verified: boolean;
  created_at: string;
}

export default function AdminAgentApprovals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingAgents, setPendingAgents] = useState<PendingAgent[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingAgents();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error: any) {
      console.error('Error checking admin status:', error);
      toast.error('Failed to verify admin access');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('travel_agents')
        .select('*')
        .eq('is_verified', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingAgents(data || []);
    } catch (error: any) {
      console.error('Error fetching pending agents:', error);
      toast.error('Failed to load pending applications');
    }
  };

  const handleApproval = async (agentId: string, approve: boolean) => {
    setProcessingId(agentId);
    try {
      const { error } = await supabase
        .from('travel_agents')
        .update({ is_verified: approve })
        .eq('id', agentId);

      if (error) throw error;

      toast.success(approve ? 'Agent approved successfully!' : 'Agent application rejected');
      fetchPendingAgents();
    } catch (error: any) {
      console.error('Error updating agent status:', error);
      toast.error('Failed to update agent status');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SimpleHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-4xl font-chiffon text-primary mb-2">Agent Application Review</h1>
          <p className="text-muted-foreground">Review and approve travel agent applications</p>
        </div>

        {pendingAgents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl font-semibold mb-2">All Caught Up!</p>
              <p className="text-muted-foreground">No pending agent applications at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingAgents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-2xl font-chiffon">{agent.agency_name}</CardTitle>
                        <CardDescription>
                          Submitted on {new Date(agent.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Review
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Contact Information</h3>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Primary Contact</dt>
                          <dd className="font-medium">{agent.primary_contact_name}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Email</dt>
                          <dd className="font-medium">{agent.email}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Phone</dt>
                          <dd className="font-medium">{agent.phone}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Business Address</dt>
                          <dd className="font-medium">{agent.business_address}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Business Details</h3>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Business Type</dt>
                          <dd className="font-medium capitalize">{agent.business_type?.replace('_', ' ')}</dd>
                        </div>
                        {agent.license_number && (
                          <div>
                            <dt className="text-muted-foreground">License Number</dt>
                            <dd className="font-medium">{agent.license_number}</dd>
                          </div>
                        )}
                        {agent.accreditations && (
                          <div>
                            <dt className="text-muted-foreground">Accreditations</dt>
                            <dd className="font-medium">{agent.accreditations}</dd>
                          </div>
                        )}
                        {agent.experience_years && (
                          <div>
                            <dt className="text-muted-foreground">Experience</dt>
                            <dd className="font-medium">{agent.experience_years} years</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>

                  {agent.specializations && agent.specializations.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Specializations</h3>
                      <div className="flex flex-wrap gap-2">
                        {agent.specializations.map((spec, idx) => (
                          <Badge key={idx} variant="secondary">{spec}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {agent.destinations && agent.destinations.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Destination Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {agent.destinations.map((dest, idx) => (
                          <Badge key={idx} variant="secondary">{dest}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {agent.bio && (
                    <div>
                      <h3 className="font-semibold mb-2">Agency Description</h3>
                      <ScrollArea className="h-24 rounded-md border p-3">
                        <p className="text-sm text-muted-foreground">{agent.bio}</p>
                      </ScrollArea>
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleApproval(agent.id, false)}
                      disabled={processingId === agent.id}
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApproval(agent.id, true)}
                      disabled={processingId === agent.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processingId === agent.id ? 'Processing...' : 'Approve'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
