import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DocumentViewer } from "@/components/admin/DocumentViewer";
import { VerificationChecklist } from "@/components/admin/VerificationChecklist";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, CheckCircle, XCircle, FileText, User } from "lucide-react";

const REJECTION_REASONS = [
  "Document expired",
  "Photo doesn't match selfie",
  "Document illegible",
  "Name doesn't match profile",
  "Document appears altered",
  "Missing required information",
  "Custom reason"
];

export default function AdminCustomerVerifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<{ url: string; type: string } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const [checklist, setChecklist] = useState([
    { id: "name_match", label: "Name on document matches profile", checked: false },
    { id: "photo_match", label: "Photo on document matches selfie", checked: false },
    { id: "valid_date", label: "Document is valid and not expired", checked: false },
    { id: "legible", label: "Document is legible and not altered", checked: false }
  ]);

  // Fetch customer verifications
  const { data: verifications, isLoading } = useQuery({
    queryKey: ['admin-customer-verifications', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('customer_verifications')
        .select(`
          *,
          user:profiles!user_id (
            id,
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    }
  });

  // Approve verification mutation
  const approveMutation = useMutation({
    mutationFn: async (verificationId: string) => {
      const currentMetadata = selectedVerification?.metadata || {};
      const { error } = await supabase
        .from('customer_verifications')
        .update({
          status: 'approved',
          metadata: {
            ...currentMetadata,
            admin_notes: adminNotes || null,
            reviewed_at: new Date().toISOString()
          }
        })
        .eq('id', verificationId);

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: selectedVerification.user_id,
        action: 'customer_verification_approved',
        entity_type: 'customer_verification',
        entity_id: verificationId,
        details: { admin_notes: adminNotes, checklist }
      });
    },
    onSuccess: () => {
      toast({
        title: "Verification Approved",
        description: "Customer verification has been approved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['admin-customer-verifications'] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve verification. Please try again.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  // Reject verification mutation
  const rejectMutation = useMutation({
    mutationFn: async (verificationId: string) => {
      const currentMetadata = selectedVerification?.metadata || {};
      const { error } = await supabase
        .from('customer_verifications')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          metadata: {
            ...currentMetadata,
            admin_notes: adminNotes || null,
            reviewed_at: new Date().toISOString()
          }
        })
        .eq('id', verificationId);

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: selectedVerification.user_id,
        action: 'customer_verification_rejected',
        entity_type: 'customer_verification',
        entity_id: verificationId,
        details: { admin_notes: adminNotes, rejection_reason: rejectionReason }
      });
    },
    onSuccess: () => {
      toast({
        title: "Verification Rejected",
        description: "Customer verification has been rejected."
      });
      queryClient.invalidateQueries({ queryKey: ['admin-customer-verifications'] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject verification. Please try again.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  const handleChecklistChange = (id: string, checked: boolean) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked } : item
    ));
  };

  const handleViewDocument = (url: string, type: string) => {
    setCurrentDocument({ url, type });
    setViewerOpen(true);
  };

  const resetForm = () => {
    setSelectedVerification(null);
    setAdminNotes("");
    setRejectionReason("");
    setChecklist(prev => prev.map(item => ({ ...item, checked: false })));
  };

  const canApprove = checklist.every(item => item.checked);

  if (isLoading) {
    return <div className="p-8">Loading verifications...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-secondary text-3xl font-bold mb-2">Customer Verifications</h1>
          <p className="text-muted-foreground">Review and approve customer identity verifications</p>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-8">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-6">
            <div className="grid gap-6">
              {verifications?.map((verification) => (
                <div key={verification.id} className="bg-card border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {(verification as any).user?.avatar_url ? (
                        <img 
                          src={(verification as any).user.avatar_url} 
                          alt="User" 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">
                          {(verification as any).user?.first_name} {(verification as any).user?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">@{(verification as any).user?.username}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted: {new Date(verification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      verification.status === 'approved' ? 'default' :
                      verification.status === 'rejected' ? 'destructive' :
                      'secondary'
                    }>
                      {verification.status}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Government ID
                      </p>
                      {verification.document_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(verification.document_url, 'Government ID')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Document
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not uploaded</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Selfie Photo
                      </p>
                      {(verification.metadata as any)?.selfie_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument((verification.metadata as any).selfie_url, 'Selfie Photo')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Selfie
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not uploaded</p>
                      )}
                    </div>
                  </div>

                  {verification.status === 'pending' && selectedVerification?.id === verification.id && (
                    <div className="mt-6 space-y-4 border-t pt-6">
                      <VerificationChecklist
                        items={checklist}
                        onItemChange={handleChecklistChange}
                      />

                      <div>
                        <label className="text-sm font-medium mb-2 block">Admin Notes (Optional)</label>
                        <Textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add any notes about this verification..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Button
                            onClick={() => approveMutation.mutate(verification.id)}
                            disabled={!canApprove || approveMutation.isPending}
                            className="w-full"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Verification
                          </Button>
                          {!canApprove && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Complete all checklist items to approve
                            </p>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <Select value={rejectionReason} onValueChange={setRejectionReason}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rejection reason..." />
                            </SelectTrigger>
                            <SelectContent>
                              {REJECTION_REASONS.map((reason) => (
                                <SelectItem key={reason} value={reason}>
                                  {reason}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => rejectMutation.mutate(verification.id)}
                            disabled={!rejectionReason || rejectMutation.isPending}
                            variant="destructive"
                            className="w-full"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject Verification
                          </Button>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={resetForm}
                        className="w-full"
                      >
                        Cancel Review
                      </Button>
                    </div>
                  )}

                  {verification.status === 'pending' && selectedVerification?.id !== verification.id && (
                    <Button
                      onClick={() => setSelectedVerification(verification)}
                      className="mt-4"
                    >
                      Start Review
                    </Button>
                  )}

                  {verification.status !== 'pending' && (verification.metadata as any)?.admin_notes && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Admin Notes:</p>
                      <p className="text-sm text-muted-foreground">{(verification.metadata as any).admin_notes}</p>
                      {verification.rejection_reason && (
                        <p className="text-sm text-destructive mt-2">
                          Reason: {verification.rejection_reason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {verifications?.length === 0 && (
                <div className="text-center py-12 bg-card rounded-lg border">
                  <p className="text-muted-foreground">
                    No {statusFilter !== 'all' ? statusFilter : ''} verifications found
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {currentDocument && (
        <DocumentViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          documentUrl={currentDocument.url}
          documentType={currentDocument.type}
          title={currentDocument.type}
        />
      )}
    </div>
  );
}
