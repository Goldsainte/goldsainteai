import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Briefcase, Check, X, DollarSign, Calendar } from "lucide-react";

interface Partnership {
  id: string;
  campaign_name: string;
  campaign_details: string;
  payment_amount: number;
  deliverables: string;
  status: string;
  created_at: string;
  brand_id: string;
}

export const PartnershipRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPartnerships();
    }
  }, [user]);

  const loadPartnerships = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('brand_partnerships')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartnerships(data || []);
    } catch (error) {
      console.error('Error loading partnerships:', error);
      toast({
        title: "Error",
        description: "Failed to load partnership requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (partnershipId: string, newStatus: 'approved' | 'rejected') => {
    setProcessingId(partnershipId);
    try {
      const { error } = await supabase
        .from('brand_partnerships')
        .update({ status: newStatus })
        .eq('id', partnershipId);

      if (error) throw error;

      toast({
        title: newStatus === 'approved' ? "Partnership Accepted! 🎉" : "Partnership Declined",
        description: newStatus === 'approved' 
          ? "You can now create sponsored content for this campaign"
          : "The brand has been notified of your decision",
      });

      loadPartnerships();
    } catch (error) {
      console.error('Error updating partnership:', error);
      toast({
        title: "Error",
        description: "Failed to update partnership status",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      approved: { variant: "default", label: "Active" },
      rejected: { variant: "destructive", label: "Declined" },
      completed: { variant: "outline", label: "Completed" },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading partnerships...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          Brand Partnerships
        </h2>
        <Badge variant="outline" className="text-base">
          {partnerships.filter(p => p.status === 'pending').length} pending
        </Badge>
      </div>

      {partnerships.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No Partnership Requests</p>
            <p className="text-muted-foreground">
              Brands will be able to send you partnership proposals here
            </p>
          </CardContent>
        </Card>
      ) : (
        partnerships.map((partnership) => (
          <Card key={partnership.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                 <div>
                   <CardTitle className="text-xl">{partnership.campaign_name}</CardTitle>
                   <p className="text-sm text-muted-foreground mt-1">
                     Brand Partnership Request
                   </p>
                 </div>
                {getStatusBadge(partnership.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">${partnership.payment_amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(partnership.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Campaign Details:</p>
                <p className="text-sm text-muted-foreground">{partnership.campaign_details}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Deliverables:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {partnership.deliverables}
                </p>
              </div>

              {partnership.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleResponse(partnership.id, 'approved')}
                    disabled={processingId === partnership.id}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept Partnership
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleResponse(partnership.id, 'rejected')}
                    disabled={processingId === partnership.id}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
