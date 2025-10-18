import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Clock, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BusinessVerification {
  id: string;
  user_id: string;
  business_name: string;
  registration_number: string | null;
  tax_id: string | null;
  business_address: any;
  registration_document_url: string | null;
  business_license_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

export const VerificationReview = () => {
  const [verifications, setVerifications] = useState<BusinessVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('business_verifications')
        .select(`
          *,
          profiles!business_verifications_user_id_fkey (username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications((data as any) || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verification: BusinessVerification) => {
    setProcessingId(verification.id);
    try {
      // Update verification status
      const { error: verificationError } = await supabase
        .from('business_verifications')
        .update({
          status: 'approved',
          verified_at: new Date().toISOString()
        })
        .eq('id', verification.id);

      if (verificationError) throw verificationError;

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_business_verified: true,
          account_type: 'business'
        })
        .eq('id', verification.user_id);

      if (profileError) throw profileError;

      toast.success('Business verification approved!');
      fetchVerifications();
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error('Failed to approve verification');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (verification: BusinessVerification) => {
    const reason = rejectionReason[verification.id];
    if (!reason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessingId(verification.id);
    try {
      const { error } = await supabase
        .from('business_verifications')
        .update({
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', verification.id);

      if (error) throw error;

      toast.success('Business verification rejected');
      fetchVerifications();
      setRejectionReason({ ...rejectionReason, [verification.id]: '' });
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Failed to reject verification');
    } finally {
      setProcessingId(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="gap-1 bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const VerificationCard = ({ verification }: { verification: BusinessVerification }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{verification.business_name}</CardTitle>
            <CardDescription>@{verification.profiles?.username || 'Unknown'}</CardDescription>
          </div>
          {statusBadge(verification.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Registration #</p>
            <p className="font-medium">{verification.registration_number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tax ID</p>
            <p className="font-medium">{verification.tax_id || 'N/A'}</p>
          </div>
        </div>

        {verification.business_address && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Business Address</p>
            <p className="text-sm">
              {verification.business_address.street}<br />
              {verification.business_address.city}, {verification.business_address.state} {verification.business_address.postal_code}<br />
              {verification.business_address.country}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {verification.registration_document_url && (
            <Button variant="outline" size="sm" className="w-full gap-2" asChild>
              <a href={verification.registration_document_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                View Registration Document
              </a>
            </Button>
          )}
          {verification.business_license_url && (
            <Button variant="outline" size="sm" className="w-full gap-2" asChild>
              <a href={verification.business_license_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                View Business License
              </a>
            </Button>
          )}
        </div>

        {verification.status === 'pending' && (
          <div className="space-y-3 pt-3 border-t">
            <div className="space-y-2">
              <Label htmlFor={`reason-${verification.id}`}>Rejection Reason (if rejecting)</Label>
              <Textarea
                id={`reason-${verification.id}`}
                value={rejectionReason[verification.id] || ''}
                onChange={(e) => setRejectionReason({ ...rejectionReason, [verification.id]: e.target.value })}
                placeholder="Provide a reason if rejecting..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(verification)}
                disabled={processingId === verification.id}
                className="flex-1 gap-2"
              >
                {processingId === verification.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReject(verification)}
                disabled={processingId === verification.id || !rejectionReason[verification.id]}
                className="flex-1 gap-2"
              >
                {processingId === verification.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Reject
              </Button>
            </div>
          </div>
        )}

        {verification.status === 'rejected' && verification.rejection_reason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
            <p className="text-sm text-red-700">{verification.rejection_reason}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Submitted: {new Date(verification.created_at).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingVerifications = verifications.filter(v => v.status === 'pending');
  const approvedVerifications = verifications.filter(v => v.status === 'approved');
  const rejectedVerifications = verifications.filter(v => v.status === 'rejected');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Business Verification Review</h2>
        <p className="text-muted-foreground">Review and approve business verification requests</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingVerifications.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedVerifications.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedVerifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingVerifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending verifications</p>
              </CardContent>
            </Card>
          ) : (
            pendingVerifications.map(verification => (
              <VerificationCard key={verification.id} verification={verification} />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-6">
          {approvedVerifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No approved verifications</p>
              </CardContent>
            </Card>
          ) : (
            approvedVerifications.map(verification => (
              <VerificationCard key={verification.id} verification={verification} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-6">
          {rejectedVerifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No rejected verifications</p>
              </CardContent>
            </Card>
          ) : (
            rejectedVerifications.map(verification => (
              <VerificationCard key={verification.id} verification={verification} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
