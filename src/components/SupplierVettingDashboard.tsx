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
  contact_email: string;
  contact_phone: string | null;
  created_at: string;
  verification_status: string;
  insurance_verified: boolean;
  license_verified: boolean;
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
      const { data, error }: any = await supabase
        .from('suppliers' as any)
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingSuppliers((data || []) as PendingSupplier[]);
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
        .from('suppliers' as any)
        .update({
          verification_status: 'verified',
          is_verified: true
        })
        .eq('id', supplierId);

      if (error) throw error;

      // Create vetting record
      await supabase
        .from('supplier_vetting' as any)
        .insert({
          supplier_id: supplierId,
          vetting_status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          vetting_notes: vettingNotes,
          approval_decision: 'approved'
        });

      toast.success('Supplier approved successfully');
      loadPendingSuppliers();
      setSelectedSupplier(null);
      setVettingNotes("");
    } catch (error: any) {
      console.error('Error approving supplier:', error);
      toast.error('Failed to approve supplier');
    }
  };

  const rejectSupplier = async (supplierId: string) => {
    try {
      const { error } = await supabase
        .from('suppliers' as any)
        .update({
          verification_status: 'rejected'
        })
        .eq('id', supplierId);

      if (error) throw error;

      // Create vetting record
      await supabase
        .from('supplier_vetting' as any)
        .insert({
          supplier_id: supplierId,
          vetting_status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          vetting_notes: vettingNotes,
          approval_decision: 'rejected',
          rejection_reason: vettingNotes
        });

      toast.success('Supplier application rejected');
      loadPendingSuppliers();
      setSelectedSupplier(null);
      setVettingNotes("");
    } catch (error: any) {
      console.error('Error rejecting supplier:', error);
      toast.error('Failed to reject supplier');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Supplier Vetting Dashboard</h1>
        <p className="text-muted-foreground">Review and approve supplier applications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Applications ({pendingSuppliers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : pendingSuppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending applications
              </p>
            ) : (
              <div className="space-y-2">
                {pendingSuppliers.map((supplier) => (
                  <button
                    key={supplier.id}
                    onClick={() => setSelectedSupplier(supplier)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedSupplier?.id === supplier.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="font-medium">{supplier.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {supplier.supplier_type} • {new Date(supplier.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedSupplier ? "Supplier Details" : "Select an Application"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedSupplier ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a supplier application to review</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{selectedSupplier.name}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <Badge>{selectedSupplier.supplier_type}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Email</p>
                      <p className="text-sm">{selectedSupplier.contact_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Phone</p>
                      <p className="text-sm">{selectedSupplier.contact_phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Applied</p>
                      <p className="text-sm">
                        {new Date(selectedSupplier.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Vetting Notes</label>
                  <Textarea
                    value={vettingNotes}
                    onChange={(e) => setVettingNotes(e.target.value)}
                    placeholder="Add notes about this supplier..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => approveSupplier(selectedSupplier.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => rejectSupplier(selectedSupplier.id)}
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
};