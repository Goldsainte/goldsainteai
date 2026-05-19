import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/BackButton";

interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  report_type: string;
  report_category: string;
  description: string;
  status: string;
  severity: string;
  created_at: string;
  admin_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
}

export default function AdminTrustSafety() {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    loadReports();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      toast.error("Admin access required");
      navigate("/");
    }
  };

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from("user_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_reports")
        .update({
          status: newStatus,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          admin_notes: resolutionNotes || null,
        })
        .eq("id", reportId);

      if (error) throw error;

      toast.success("Report updated successfully");
      setSelectedReport(null);
      setResolutionNotes("");
      loadReports();
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("Failed to update report");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", icon: AlertTriangle },
      under_review: { variant: "default", icon: Shield },
      resolved: { variant: "default", icon: CheckCircle },
      dismissed: { variant: "outline", icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl">
      <BackButton className="mb-6" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Trust & Safety
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and manage user reports
        </p>
      </div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reports to review</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {report.report_type.replace("_", " ")} - {report.report_category.replace("_", " ")}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Severity: <Badge variant="outline">{report.severity}</Badge>
                    </p>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium mb-1">Description:</p>
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  Reported on: {new Date(report.created_at).toLocaleDateString()}
                </div>

                {report.admin_notes && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="font-medium text-sm mb-1">Admin Notes:</p>
                    <p className="text-sm">{report.admin_notes}</p>
                  </div>
                )}

                {report.status === "pending" && (
                  <div className="space-y-3 border-t pt-4">
                    <Textarea
                      placeholder="Add resolution notes..."
                      value={selectedReport === report.id ? resolutionNotes : ""}
                      onChange={(e) => {
                        setSelectedReport(report.id);
                        setResolutionNotes(e.target.value);
                      }}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(report.id, "under_review")}
                      >
                        Mark Under Review
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleUpdateStatus(report.id, "resolved")}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(report.id, "dismissed")}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
