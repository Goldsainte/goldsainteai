import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, FileText, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AdminTransportVendorVetting() {
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPendingVendors();
  }, []);

  const loadPendingVendors = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers" as any)
        .select(`
          *,
          transportation_vendors (*),
          supplier_vetting (*)
        `)
        .eq("supplier_type", "transportation")
        .eq("verification_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingVendors(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load pending vendors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vendorId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('approve-transportation-vendor', {
        body: {
          supplierId: vendorId,
          approved: true,
          notes: reviewNotes
        }
      });

      if (error) throw error;

      toast({
        title: "Vendor Approved",
        description: data.message || "The transportation vendor has been approved and activated."
      });

      loadPendingVendors();
      setSelectedVendor(null);
      setReviewNotes("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleReject = async (vendorId: string) => {
    if (!reviewNotes.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('approve-transportation-vendor', {
        body: {
          supplierId: vendorId,
          approved: false,
          notes: reviewNotes
        }
      });

      if (error) throw error;

      toast({
        title: "Vendor Rejected",
        description: data.message || "The vendor application has been rejected."
      });

      loadPendingVendors();
      setSelectedVendor(null);
      setReviewNotes("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Transportation Vendor Vetting</h1>
        <p className="text-muted-foreground">Review and approve vendor applications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Applications ({pendingVendors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingVendors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending applications
                </p>
              ) : (
                pendingVendors.map((vendor) => (
                  <button
                    key={vendor.id}
                    onClick={() => setSelectedVendor(vendor)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedVendor?.id === vendor.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="font-medium">{vendor.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedVendor ? "Vendor Details" : "Select an Application"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedVendor ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a vendor application to review</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{selectedVendor.name}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Email</p>
                      <p className="font-medium">{selectedVendor.contact_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Phone</p>
                      <p className="font-medium">{selectedVendor.contact_phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Service Type</p>
                      <Badge>{selectedVendor.supplier_type}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Applied</p>
                      <p className="font-medium">
                        {new Date(selectedVendor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedVendor.transportation_vendors?.[0] && (
                  <Tabs defaultValue="business" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="business">Business</TabsTrigger>
                      <TabsTrigger value="compliance">Compliance</TabsTrigger>
                      <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    </TabsList>

                    <TabsContent value="business" className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Service Areas</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedVendor.transportation_vendors[0].service_areas?.map((area: string, i: number) => (
                            <Badge key={i} variant="secondary">{area}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vehicle Types</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedVendor.transportation_vendors[0].vehicle_types?.map((type: string, i: number) => (
                            <Badge key={i} variant="outline">{type}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Years in Business</p>
                        <p className="font-medium">
                          {selectedVendor.transportation_vendors[0].years_in_business || "Not provided"}
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="compliance" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Insurance Policy</p>
                          <p className="font-medium">
                            {selectedVendor.transportation_vendors[0].insurance_policy_number || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Insurance Expiry</p>
                          <p className="font-medium">
                            {selectedVendor.transportation_vendors[0].insurance_expiry_date || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Commercial License</p>
                          <p className="font-medium">
                            {selectedVendor.transportation_vendors[0].commercial_license_number || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">DOT Number</p>
                          <p className="font-medium">
                            {selectedVendor.transportation_vendors[0].dot_number || "N/A"}
                          </p>
                        </div>
                      </div>
                      
                      {(!selectedVendor.transportation_vendors[0].insurance_policy_number ||
                        !selectedVendor.transportation_vendors[0].commercial_license_number) && (
                        <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-destructive">Missing Required Documents</p>
                            <p className="text-muted-foreground">
                              Some compliance documents are missing. Request these before approval.
                            </p>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Pricing Model</p>
                          <Badge>{selectedVendor.transportation_vendors[0].pricing_model || "Not set"}</Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Base Hourly Rate</p>
                          <p className="font-medium">
                            ${selectedVendor.transportation_vendors[0].base_hourly_rate || "N/A"}/hour
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Minimum Booking</p>
                          <p className="font-medium">
                            {selectedVendor.transportation_vendors[0].minimum_booking_hours || 2} hours
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                <div>
                  <Label htmlFor="reviewNotes">Review Notes</Label>
                  <Textarea
                    id="reviewNotes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this review..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprove(selectedVendor.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Vendor
                  </Button>
                  <Button
                    onClick={() => handleReject(selectedVendor.id)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
