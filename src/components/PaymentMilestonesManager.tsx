import { useState, useEffect } from "react";
import { Plus, CheckCircle2, Clock, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Milestone {
  id: string;
  milestone_number: number;
  title: string;
  description: string;
  amount: number;
  currency: string;
  percentage: number;
  due_date: string;
  status: string;
  paid_at: string | null;
}

interface PaymentMilestonesManagerProps {
  jobId: string;
  totalAmount: number;
  currency: string;
  isAgent: boolean;
  isAdmin: boolean;
}

export const PaymentMilestonesManager = ({
  jobId,
  totalAmount,
  currency,
  isAgent,
  isAdmin,
}: PaymentMilestonesManagerProps) => {
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    percentage: "",
    due_date: "",
  });

  useEffect(() => {
    fetchMilestones();
  }, [jobId]);

  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_milestones")
        .select("*")
        .eq("job_id", jobId)
        .order("milestone_number", { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error: any) {
      console.error("Error fetching milestones:", error);
      toast({
        title: "Error loading milestones",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();

    const percentage = parseFloat(newMilestone.percentage);
    if (percentage <= 0 || percentage > 100) {
      toast({
        title: "Invalid percentage",
        description: "Percentage must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    // Check total percentage
    const currentTotal = milestones.reduce((sum, m) => sum + (m.percentage || 0), 0);
    if (currentTotal + percentage > 100) {
      toast({
        title: "Exceeds 100%",
        description: `Current total is ${currentTotal}%. Adding ${percentage}% would exceed 100%.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const amount = (totalAmount * percentage) / 100;
      const nextNumber = milestones.length + 1;

      const { error } = await supabase.from("payment_milestones").insert({
        job_id: jobId,
        milestone_number: nextNumber,
        title: newMilestone.title,
        description: newMilestone.description,
        amount,
        currency,
        percentage,
        due_date: newMilestone.due_date,
      });

      if (error) throw error;

      toast({
        title: "Milestone created",
        description: "Payment milestone has been added successfully.",
      });

      setDialogOpen(false);
      setNewMilestone({ title: "", description: "", percentage: "", due_date: "" });
      fetchMilestones();
    } catch (error: any) {
      console.error("Error creating milestone:", error);
      toast({
        title: "Failed to create milestone",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      in_progress: { variant: "default", label: "In Progress" },
      completed: { variant: "default", label: "Completed" },
      approved: { variant: "default", label: "Approved" },
      paid: { variant: "default", label: "Paid" },
      disputed: { variant: "destructive", label: "Disputed" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const calculateProgress = () => {
    const paidMilestones = milestones.filter((m) => m.status === "paid");
    const paidPercentage = paidMilestones.reduce((sum, m) => sum + (m.percentage || 0), 0);
    return paidPercentage;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Milestones
            </CardTitle>
            <CardDescription>
              Break down the payment into manageable milestones
            </CardDescription>
          </div>
          {(isAdmin || isAgent) && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Payment Milestone</DialogTitle>
                  <DialogDescription>
                    Define a new milestone for this job
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateMilestone} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Milestone Title *</Label>
                    <Input
                      id="title"
                      value={newMilestone.title}
                      onChange={(e) =>
                        setNewMilestone({ ...newMilestone, title: e.target.value })
                      }
                      placeholder="e.g., Initial Planning"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newMilestone.description}
                      onChange={(e) =>
                        setNewMilestone({ ...newMilestone, description: e.target.value })
                      }
                      placeholder="What will be delivered at this milestone?"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="percentage">Percentage (%) *</Label>
                      <Input
                        id="percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={newMilestone.percentage}
                        onChange={(e) =>
                          setNewMilestone({ ...newMilestone, percentage: e.target.value })
                        }
                        placeholder="25"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {newMilestone.percentage &&
                          `≈ ${currency} ${(
                            (totalAmount * parseFloat(newMilestone.percentage)) /
                            100
                          ).toFixed(2)}`}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={newMilestone.due_date}
                        onChange={(e) =>
                          setNewMilestone({ ...newMilestone, due_date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Milestone</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestones.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{calculateProgress().toFixed(1)}% paid</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        )}

        {milestones.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No payment milestones set up yet
            </p>
            {(isAdmin || isAgent) && (
              <p className="text-xs text-muted-foreground mt-1">
                Add milestones to break down the payment
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <Card key={milestone.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          {milestone.milestone_number}. {milestone.title}
                        </h4>
                        {getStatusBadge(milestone.status)}
                      </div>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-semibold">
                        {milestone.currency} {milestone.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {milestone.percentage}% of total
                      </p>
                    </div>
                    {milestone.due_date && (
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(milestone.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {milestone.paid_at && (
                      <div>
                        <p className="text-muted-foreground">Paid</p>
                        <p className="font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {new Date(milestone.paid_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
