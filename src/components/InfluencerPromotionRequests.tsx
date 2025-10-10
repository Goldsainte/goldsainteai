import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PromotionRequest {
  id: string;
  package_id: string;
  status: string;
  created_at: string;
  promo_code: string;
  package: {
    package_name: string;
    destination: string;
    duration_days: number;
    retail_price: number;
    cover_image_url: string | null;
    agent_id: string;
  };
  agent: {
    agency_name: string;
    profile_image_url: string | null;
  };
}

export const InfluencerPromotionRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("influencer_promotions")
        .select(`
          id,
          package_id,
          status,
          created_at,
          promo_code,
          package:agent_packages!influencer_promotions_package_id_fkey(
            package_name,
            destination,
            duration_days,
            retail_price,
            cover_image_url,
            agent_id
          )
        `)
        .eq('influencer_id', user?.id)
        .eq('initiated_by', 'agent')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch agent details for each request
      const requestsWithAgent = await Promise.all(
        (data || []).map(async (request) => {
          const { data: agentData } = await supabase
            .from('travel_agents')
            .select('agency_name, profile_image_url')
            .eq('id', request.package.agent_id)
            .single();

          return {
            ...request,
            agent: agentData || { agency_name: 'Unknown Agent', profile_image_url: null },
          };
        })
      );

      setRequests(requestsWithAgent as any);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load promotion requests");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from("influencer_promotions")
        .update({
          status: accept ? 'active' : 'rejected',
        })
        .eq("id", requestId);

      if (error) throw error;

      toast.success(accept ? "Request accepted!" : "Request declined");
      fetchRequests();
    } catch (error) {
      console.error("Error responding to request:", error);
      toast.error("Failed to respond to request");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No pending promotion requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Promotion Requests</h2>
        <p className="text-muted-foreground">
          Agents have invited you to promote their packages
        </p>
      </div>

      {requests.map((request) => (
        <Card key={request.id} className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {request.package.cover_image_url && (
              <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={request.package.cover_image_url}
                  alt={request.package.package_name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{request.package.package_name}</h3>
                <p className="text-sm text-muted-foreground">
                  by {request.agent.agency_name}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="outline">{request.package.destination}</Badge>
                <Badge variant="outline">{request.package.duration_days} days</Badge>
                <Badge variant="outline">${request.package.retail_price}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Your Promo Code:</p>
                <Badge variant="secondary" className="font-mono">
                  {request.promo_code}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  5% discount for your followers
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleResponse(request.id, true)}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResponse(request.id, false)}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
