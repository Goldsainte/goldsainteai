import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, DollarSign, User, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface CancellationWithDetails {
  id: string;
  booking_id: string;
  user_id: string;
  cancellation_reason: string;
  cancellation_date: string;
  refund_percentage: number;
  refund_amount: number;
  original_amount: number;
  currency: string;
  status: string;
  admin_notes: string | null;
  processed_at: string | null;
  bookings: {
    booking_reference: string;
    booking_type: string;
    destination: string;
    check_in_date: string;
    check_out_date: string;
  };
  profiles: {
    username: string;
    email: string;
  };
}

export default function AdminCancellations() {
  const { toast } = useToast();
  const [cancellations, setCancellations] = useState<CancellationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCancellation, setSelectedCancellation] = useState<CancellationWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [customRefundPercentage, setCustomRefundPercentage] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadCancellations();
  }, []);

  const loadCancellations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("booking_cancellations")
        .select(`
          *,
          bookings!inner (
            booking_reference,
            booking_type,
            destination,
            check_in_date,
            check_out_date
          ),
          profiles!user_id (
            username,
            email
          )
        `)
        .order("cancellation_date", { ascending: false });

      if (error) throw error;
      setCancellations(data as any || []);
    } catch (error: any) {
      console.error("Error loading cancellations:", error);
      toast({
        title: "Error",
        description: "Failed to load cancellations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cancellation: CancellationWithDetails, actionType: "approve" | "reject") => {
    setSelectedCancellation(cancellation);
    setAction(actionType);
    setCustomRefundPercentage(actionType === "approve" ? cancellation.refund_percentage : null);
    setAdminNotes("");
    setDialogOpen(true);
  };

  const handleProcessCancellation = async () => {
    if (!selectedCancellation || !action) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-process-cancellation", {
        body: {
          cancellationId: selectedCancellation.id,
          action,
          customRefundPercentage: action === "approve" ? customRefundPercentage : undefined,
          adminNotes: adminNotes.trim() || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message,
      });

      setDialogOpen(false);
      loadCancellations();
    } catch (error: any) {
      console.error("Error processing cancellation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process cancellation",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: "Pending Review", variant: "secondary", icon: Clock },
      approved: { label: "Approved", variant: "default", icon: CheckCircle },
      rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
      completed: { label: "Refund Processed", variant: "outline", icon: CheckCircle },
    };

    const item = config[status] || { label: status, variant: "outline", icon: AlertCircle };
    const Icon = item.icon;

    return (
      <Badge variant={item.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {item.label}
      </Badge>
    );
  };

  const calculateRefundPreview = () => {
    if (!selectedCancellation || customRefundPercentage === null) return null;
    const amount = (selectedCancellation.original_amount * customRefundPercentage) / 100;
    return amount.toFixed(2);
  };

  const pendingCancellations = cancellations.filter((c) => c.status === "pending");
  const approvedCancellations = cancellations.filter((c) => c.status === "approved");
  const processedCancellations = cancellations.filter((c) => c.status === "completed");
  const rejectedCancellations = cancellations.filter((c) => c.status === "rejected");

  const CancellationCard = ({ cancellation }: { cancellation: CancellationWithDetails }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {cancellation.bookings.booking_type} - {cancellation.bookings.destination}
            </CardTitle>
            <CardDescription>
              Booking #{cancellation.bookings.booking_reference}
            </CardDescription>
          </div>
          {getStatusBadge(cancellation.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{cancellation.profiles?.username || "Unknown User"}</span>
            <span className="text-muted-foreground">({cancellation.profiles?.email})</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(cancellation.bookings.check_in_date), "MMM dd, yyyy")}
              {cancellation.bookings.check_out_date &&
                ` - ${format(new Date(cancellation.bookings.check_out_date), "MMM dd, yyyy")}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>
              Original: {cancellation.currency} {cancellation.original_amount.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">
              Refund ({cancellation.refund_percentage}%): {cancellation.currency}{" "}
              {cancellation.refund_amount.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Requested: {format(new Date(cancellation.cancellation_date), "MMM dd, yyyy HH:mm")}</span>
          </div>
        </div>

        {cancellation.cancellation_reason && (
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-1">Reason:</p>
            <p className="text-sm text-muted-foreground">{cancellation.cancellation_reason}</p>
          </div>
        )}

        {cancellation.admin_notes && (
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-1">Admin Notes:</p>
            <p className="text-sm text-muted-foreground">{cancellation.admin_notes}</p>
          </div>
        )}

        {cancellation.status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="default"
              onClick={() => handleOpenDialog(cancellation, "approve")}
              className="flex-1"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleOpenDialog(cancellation, "reject")}
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cancellation Management</h1>
          <p className="text-muted-foreground">Review and process booking cancellation requests</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Review ({pendingCancellations.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedCancellations.length})
            </TabsTrigger>
            <TabsTrigger value="processed">
              Refund Processed ({processedCancellations.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedCancellations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingCancellations.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No pending cancellations</p>
                </CardContent>
              </Card>
            ) : (
              pendingCancellations.map((cancellation) => (
                <CancellationCard key={cancellation.id} cancellation={cancellation} />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedCancellations.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No approved cancellations</p>
                </CardContent>
              </Card>
            ) : (
              approvedCancellations.map((cancellation) => (
                <CancellationCard key={cancellation.id} cancellation={cancellation} />
              ))
            )}
          </TabsContent>

          <TabsContent value="processed" className="space-y-4">
            {processedCancellations.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No processed refunds</p>
                </CardContent>
              </Card>
            ) : (
              processedCancellations.map((cancellation) => (
                <CancellationCard key={cancellation.id} cancellation={cancellation} />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedCancellations.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No rejected cancellations</p>
                </CardContent>
              </Card>
            ) : (
              rejectedCancellations.map((cancellation) => (
                <CancellationCard key={cancellation.id} cancellation={cancellation} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Approval/Rejection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve Cancellation" : "Reject Cancellation"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "Review and adjust the refund amount if necessary"
                : "Provide a reason for rejecting this cancellation request"}
            </DialogDescription>
          </DialogHeader>

          {selectedCancellation && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Booking Details:</p>
                  <p className="text-sm mt-1">
                    {selectedCancellation.bookings.booking_type} - {selectedCancellation.bookings.destination}
                  </p>
                  <p className="text-sm">Original Amount: {selectedCancellation.currency} {selectedCancellation.original_amount.toFixed(2)}</p>
                </AlertDescription>
              </Alert>

              {action === "approve" && (
                <div className="space-y-2">
                  <Label>Refund Percentage (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={customRefundPercentage ?? ""}
                    onChange={(e) => setCustomRefundPercentage(parseFloat(e.target.value) || 0)}
                  />
                  {customRefundPercentage !== null && (
                    <p className="text-sm text-muted-foreground">
                      Refund Amount: {selectedCancellation.currency} {calculateRefundPreview()}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Admin Notes {action === "reject" && "*"}</Label>
                <Textarea
                  placeholder={
                    action === "approve"
                      ? "Optional notes about this approval..."
                      : "Explain why this cancellation is being rejected..."
                  }
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              variant={action === "approve" ? "default" : "destructive"}
              onClick={handleProcessCancellation}
              disabled={processing || (action === "reject" && !adminNotes.trim())}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {action === "approve" ? "Approve & Process" : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
