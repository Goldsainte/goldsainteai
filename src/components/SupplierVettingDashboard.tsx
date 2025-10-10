import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PendingSupplier {
  id: string;
  name: string;
  supplier_type: string;
  business_name: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  created_at: string;
  verification_documents: any;
}

interface VettingRecord {
  id: string;
  supplier_id: string;
  background_check_status: string;
  license_check_status: string;
  insurance_check_status: string;
  reference_check_status: string;
  vetting_notes: string;
}

export const SupplierVettingDashboard = () => {
  const { user } = useAuth();
  const [pendingSuppliers, setPendingSuppliers] = useState<PendingSupplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<PendingSupplier | null>(null);
  const [vettingNotes, setVettingNotes] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingSuppliers();
  }, []);

  const loadPendingSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingSuppliers(data || []);
    } catch (error: any) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load pending suppliers');
    } finally {
      setLoading(false);
    }
  };

  const approveSupplier = async (supplierId: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: user?.id
        })
        .eq('id', supplierId);

      if (error) throw error;

      // Create vetting record
      await supabase
        .from('supplier_vetting')
        .insert({
          supplier_id: supplierId,
          background_check_status: 'passed',
          license_check_status: 'verified',
          insurance_check_status: 'verified',
          reference_check_status: 'verified',
          vetting_notes: vettingNotes,
          vetted_by: user?.id,
          vetted_at: new Date().toISOString(),
          approval_decision: 'approved'
        });

      toast.success('Supplier approved');
      loadPendingSuppliers();
      setSelectedSupplier(null);
      setVettingNotes("");
    } catch (error: any) {
      console.error('Error approving supplier:', error);
      toast.error('Failed to approve supplier');
    }
  };

  const rejectSupplier = async (supplierId: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          verification_status: 'rejected',
          verified_by: user?.id
        })
        .eq('id', supplierId);

      if (error) throw error;

      // Create vetting record
      await supabase
        .from('supplier_vetting')
        .insert({
          supplier_id: supplierId,
          vetting_notes: vettingNotes,
          vetted_by: user?.id,
          vetted_at: new Date().toISOString(),
          approval_decision: 'rejected',
          rejection_reason: reason
        });

      toast.success('Supplier rejected');
      loadPendingSuppliers();
      setSelectedSupplier(null);
      setVettingNotes("");
    } catch (error: any) {
      console.error('Error rejecting supplier:', error);
      toast.error('Failed to reject supplier');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Supplier Vetting</h2>
          <p className="text-muted-foreground">Review and approve supplier applications</p>
        </div>
        <Badge variant="secondary">
          {pendingSuppliers.length} Pending
        </Badge>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold">Pending Applications</h3>
            {pendingSuppliers.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No pending supplier applications
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingSuppliers.map(supplier => (
                <Card
                  key={supplier.id}
                  className={`cursor-pointer transition-all ${
                    selectedSupplier?.id === supplier.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedSupplier(supplier)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{supplier.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {supplier.business_name}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {supplier.supplier_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Applied: {new Date(supplier.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div>
            {selectedSupplier ? (
              <Card>
                <CardHeader>
                  <CardTitle>Application Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Business Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Name:</span> {selectedSupplier.name}</p>
                      <p><span className="text-muted-foreground">Business:</span> {selectedSupplier.business_name}</p>
                      <p><span className="text-muted-foreground">Type:</span> {selectedSupplier.supplier_type}</p>
                      <p><span className="text-muted-foreground">Email:</span> {selectedSupplier.contact_email}</p>
                      <p><span className="text-muted-foreground">Phone:</span> {selectedSupplier.contact_phone}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedSupplier.description}</p>
                  </div>

                  {selectedSupplier.verification_documents && Array.isArray(selectedSupplier.verification_documents) && selectedSupplier.verification_documents.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Documents</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedSupplier.verification_documents.length} document(s) uploaded
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">Vetting Notes</h4>
                    <Textarea
                      value={vettingNotes}
                      onChange={(e) => setVettingNotes(e.target.value)}
                      placeholder="Add notes about background checks, references, etc."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => approveSupplier(selectedSupplier.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => rejectSupplier(selectedSupplier.id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Select an application to review
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
