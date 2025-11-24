import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ApplicationType = "agent" | "brand";

interface AgentApplication {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  agency_name: string | null;
  years_experience: number | null;
  specializations: string[] | null;
  stripe_verification_status: string | null;
  stripe_verified_at: string | null;
  admin_status: string | null;
  created_at: string | null;
}

interface BrandApplication {
  id: string;
  brand_profile_id: string;
  brand_name: string;
  brand_type: string;
  primary_contact_name: string;
  primary_contact_email: string;
  website: string;
  regions: string[];
  style_tags: string[];
  stripe_verification_status: string;
  stripe_verified_at: string;
  admin_status: string;
  created_at: string;
}

export default function ApplicationReviewDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ApplicationType>("agent");
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Fetch agent applications
  const { data: agentApplications, isLoading: loadingAgents } = useQuery({
    queryKey: ["admin-agent-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_applications")
        .select("id, email, first_name, last_name, agency_name, years_experience, specializations, stripe_verification_status, stripe_verified_at, admin_status, created_at")
        .eq("stripe_verification_status", "verified")
        .eq("admin_status", "pending_review")
        .order("created_at", { ascending: false }) as any;

      if (error) throw error;
      return data as AgentApplication[];
    },
  });

  // Fetch brand applications
  const { data: brandApplications, isLoading: loadingBrands } = useQuery({
    queryKey: ["admin-brand-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_applications")
        .select("*")
        .eq("stripe_verification_status", "verified")
        .eq("admin_status", "pending_review")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BrandApplication[];
    },
  });

  // Approve application mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: ApplicationType }) => {
      const { data, error } = await supabase.functions.invoke("create-approved-account", {
        body: { applicationType: type, applicationId: id },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Application approved",
        description: "Account created successfully. Applicant has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: [`admin-${variables.type}-applications`] });
    },
    onError: (error) => {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject application mutation
  const rejectMutation = useMutation({
    mutationFn: async ({
      id,
      type,
      reason,
    }: {
      id: string;
      type: ApplicationType;
      reason: string;
    }) => {
      const tableName = type === "agent" ? "agent_applications" : "brand_applications";
      
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          admin_status: "rejected",
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) throw updateError;

      const { error: notifyError } = await supabase.functions.invoke(
        "notify-applicant-status-change",
        {
          body: {
            applicationType: type,
            applicationId: id,
            newStatus: "rejected",
            adminNotes: reason,
          },
        }
      );

      if (notifyError) throw notifyError;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Application rejected",
        description: "Applicant has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: [`admin-${variables.type}-applications`] });
      setNotes((prev) => {
        const updated = { ...prev };
        delete updated[variables.id];
        return updated;
      });
    },
    onError: (error) => {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: string, type: ApplicationType) => {
    if (
      !confirm(
        "Are you sure you want to approve this application? This will create a user account."
      )
    )
      return;
    approveMutation.mutate({ id, type });
  };

  const handleReject = (id: string, type: ApplicationType) => {
    const reason = notes[id]?.trim();
    if (!reason) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }
    if (!confirm("Are you sure you want to reject this application?")) return;
    rejectMutation.mutate({ id, type, reason });
  };

  const renderAgentCard = (app: AgentApplication) => (
    <Card key={app.id} className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {app.first_name} {app.last_name}
            </CardTitle>
            <CardDescription className="mt-1">
              {app.email}
            </CardDescription>
            <CardDescription className="mt-1">
              {app.agency_name || "No agency"} • {app.years_experience || 0} years experience
            </CardDescription>
          </div>
          <Badge variant="secondary" className="ml-2">
            Verified
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="col-span-2">
            <span className="font-medium">Application ID:</span> {app.id}
          </div>
          <div>
            <span className="font-medium">Applied:</span>{" "}
            {app.created_at ? new Date(app.created_at).toLocaleDateString() : "N/A"}
          </div>
          <div>
            <span className="font-medium">Verified:</span>{" "}
            {app.stripe_verified_at ? new Date(app.stripe_verified_at).toLocaleDateString() : "N/A"}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Specializations:</span>{" "}
            {app.specializations?.join(", ") || "None specified"}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Rejection reason (if rejecting):
          </label>
          <Textarea
            placeholder="Provide detailed feedback..."
            value={notes[app.id] || ""}
            onChange={(e) => setNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
            className="mb-3"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleApprove(app.id, "agent")}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            className="flex-1"
          >
            {approveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Approve
          </Button>
          <Button
            onClick={() => handleReject(app.id, "agent")}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            variant="destructive"
            className="flex-1"
          >
            {rejectMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderBrandCard = (app: BrandApplication) => (
    <Card key={app.id} className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{app.brand_name}</CardTitle>
            <CardDescription className="mt-1">
              {app.brand_type} • {app.primary_contact_name}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="ml-2">
            Verified
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Contact:</span> {app.primary_contact_email}
          </div>
          <div>
            <span className="font-medium">Applied:</span>{" "}
            {new Date(app.created_at).toLocaleDateString()}
          </div>
          {app.website && (
            <div className="col-span-2">
              <span className="font-medium">Website:</span>{" "}
              <a
                href={app.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                {app.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {app.regions && app.regions.length > 0 && (
            <div className="col-span-2">
              <span className="font-medium">Regions:</span> {app.regions.join(", ")}
            </div>
          )}
          {app.style_tags && app.style_tags.length > 0 && (
            <div className="col-span-2">
              <span className="font-medium">Style tags:</span> {app.style_tags.join(", ")}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Rejection reason (if rejecting):
          </label>
          <Textarea
            placeholder="Provide detailed feedback..."
            value={notes[app.id] || ""}
            onChange={(e) => setNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
            className="mb-3"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleApprove(app.id, "brand")}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            className="flex-1"
          >
            {approveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Approve
          </Button>
          <Button
            onClick={() => handleReject(app.id, "brand")}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            variant="destructive"
            className="flex-1"
          >
            {rejectMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Application Review Dashboard</h1>
        <p className="text-muted-foreground">
          Review and approve agent and brand applications that have completed identity verification.
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Only applications with verified Stripe Identity status appear here. Approving creates a user
          account automatically.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ApplicationType)}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="agent">
            Agent Applications ({agentApplications?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="brand">
            Brand Applications ({brandApplications?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent">
          {loadingAgents ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : agentApplications && agentApplications.length > 0 ? (
            <div>{agentApplications.map(renderAgentCard)}</div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No pending agent applications
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="brand">
          {loadingBrands ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : brandApplications && brandApplications.length > 0 ? (
            <div>{brandApplications.map(renderBrandCard)}</div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No pending brand applications
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
