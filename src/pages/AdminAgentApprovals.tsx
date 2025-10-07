import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface VerificationRequest {
  id: string;
  agent_id: string;
  verification_type: string;
  status: string;
  submitted_at: string;
  document_urls: any;
  additional_info: any;
  travel_agents: {
    agency_name: string;
    email: string;
  };
}

interface AgentProfile {
  id: string;
  user_id: string;
  agency_name: string;
  email: string;
  bio: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  business_type: string;
  phone: string;
}

export default function AdminAgentApprovals() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [pendingAgents, setPendingAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (roleLoading) return;
    if (!user || !isAdmin) {
      navigate('/');
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      return;
    }
    loadRequests();
    loadPendingAgents();
  }, [user, isAdmin, roleLoading, navigate]);

  const loadPendingAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("travel_agents")
        .select('*')
        .or('is_verified.eq.false,is_active.eq.false')
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingAgents(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading agents",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("agent_verification_requests")
        .select(`
          *,
          travel_agents (
            agency_name,
            email
          )
        `)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading requests",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      const { error: requestError } = await supabase
        .from("agent_verification_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);

      if (requestError) throw requestError;

      // Update agent verification status
      const updateData: any = {};
      switch (selectedRequest.verification_type) {
        case "identity":
          updateData.identity_verified = true;
          updateData.identity_verification_date = new Date().toISOString();
          break;
        case "background_check":
          updateData.background_check_status = "approved";
          updateData.background_check_date = new Date().toISOString();
          break;
        case "professional_license":
          updateData.professional_license_verified = true;
          break;
        case "insurance":
          updateData.insurance_verified = true;
          break;
      }

      const { error: agentError } = await supabase
        .from("travel_agents")
        .update(updateData)
        .eq("id", selectedRequest.agent_id);

      if (agentError) throw agentError;

      toast({
        title: "Request approved",
        description: "Agent verification has been approved",
      });

      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !reviewNotes.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("agent_verification_requests")
        .update({
          status: "rejected",
          rejection_reason: reviewNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Request rejected",
        description: "Agent has been notified of the rejection",
      });

      setSelectedRequest(null);
      setReviewNotes("");
      loadRequests();
    } catch (error: any) {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveAgent = async () => {
    if (!selectedAgent) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("travel_agents")
        .update({
          is_verified: true,
          is_active: true,
        })
        .eq("id", selectedAgent.id);

      if (error) throw error;

      toast({
        title: "Agent approved",
        description: `${selectedAgent.agency_name} is now verified and active`,
      });

      setSelectedAgent(null);
      loadPendingAgents();
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectAgent = async () => {
    if (!selectedAgent) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("travel_agents")
        .delete()
        .eq("id", selectedAgent.id);

      if (error) throw error;

      toast({
        title: "Agent rejected",
        description: "Agent profile has been removed",
      });

      setSelectedAgent(null);
      loadPendingAgents();
    } catch (error: any) {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const filterRequests = (status: string) =>
    requests.filter((r) => r.status === status);

  const RequestCard = ({ request }: { request: VerificationRequest }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {request.travel_agents.agency_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {request.travel_agents.email}
            </p>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Type:</span>{" "}
            {request.verification_type.replace("_", " ")}
          </p>
          <p className="text-sm">
            <span className="font-medium">Submitted:</span>{" "}
            {new Date(request.submitted_at).toLocaleDateString()}
          </p>
          <p className="text-sm">
            <span className="font-medium">Documents:</span>{" "}
            {request.document_urls?.length || 0} files
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedRequest(request)}
            className="w-full mt-2"
          >
            <Eye className="mr-2 h-4 w-4" />
            Review Request
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Agent Management</h1>

        {/* Pending Agent Profiles Section */}
        {pendingAgents.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>New Agent Applications ({pendingAgents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingAgents.map((agent) => (
                  <Card key={agent.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{agent.agency_name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{agent.email}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant={agent.is_active ? "default" : "secondary"}>
                            {agent.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant={agent.is_verified ? "default" : "outline"}>
                            {agent.is_verified ? "Verified" : "Unverified"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Type:</span> {agent.business_type}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Phone:</span> {agent.phone}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Applied:</span>{" "}
                          {new Date(agent.created_at).toLocaleDateString()}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAgent(agent)}
                          className="w-full mt-2"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Review Application
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({filterRequests("pending").length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({filterRequests("approved").length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({filterRequests("rejected").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterRequests("pending").map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
              {filterRequests("pending").length === 0 && (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  No pending requests
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterRequests("approved").map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
              {filterRequests("approved").length === 0 && (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  No approved requests
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterRequests("rejected").map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
              {filterRequests("rejected").length === 0 && (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  No rejected requests
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Verification Request</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label>Agency Name</Label>
                <p className="text-sm mt-1">
                  {selectedRequest.travel_agents.agency_name}
                </p>
              </div>

              <div>
                <Label>Verification Type</Label>
                <p className="text-sm mt-1">
                  {selectedRequest.verification_type.replace("_", " ")}
                </p>
              </div>

              <div>
                <Label>Documents</Label>
                <div className="space-y-2 mt-2">
                  {selectedRequest.document_urls?.map((url: string, i: number) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(url, "_blank")}
                    >
                      View Document {i + 1}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedRequest.status === "pending" && (
                <>
                  <div>
                    <Label htmlFor="review-notes">
                      Review Notes (required for rejection)
                    </Label>
                    <Textarea
                      id="review-notes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes or rejection reason..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={processing}
                    >
                      {processing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Reject
                    </Button>
                    <Button onClick={handleApprove} disabled={processing}>
                      {processing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Agent Application Review Dialog */}
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Agent Application</DialogTitle>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-4">
              <div>
                <Label>Agency Name</Label>
                <p className="text-sm mt-1">{selectedAgent.agency_name}</p>
              </div>

              <div>
                <Label>Business Type</Label>
                <p className="text-sm mt-1">{selectedAgent.business_type}</p>
              </div>

              <div>
                <Label>Email</Label>
                <p className="text-sm mt-1">{selectedAgent.email}</p>
              </div>

              <div>
                <Label>Phone</Label>
                <p className="text-sm mt-1">{selectedAgent.phone}</p>
              </div>

              <div>
                <Label>Bio</Label>
                <p className="text-sm mt-1">{selectedAgent.bio}</p>
              </div>

              <div>
                <Label>Current Status</Label>
                <div className="flex gap-2 mt-1">
                  <Badge variant={selectedAgent.is_active ? "default" : "secondary"}>
                    {selectedAgent.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant={selectedAgent.is_verified ? "default" : "outline"}>
                    {selectedAgent.is_verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={handleRejectAgent}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Reject & Delete
                </Button>
                <Button onClick={handleApproveAgent} disabled={processing}>
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Approve & Activate
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
