import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";

interface GroupPaymentStatusProps {
  jobId: string;
}

interface Traveler {
  id: string;
  traveler_name: string;
  traveler_email: string;
  traveler_number: number;
  amount_owed: number;
  currency: string;
  payment_status: string;
  paid_at: string | null;
  stripe_payment_link: string;
}

export const GroupPaymentStatus = ({ jobId }: GroupPaymentStatusProps) => {
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTravelers();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('group-payment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_booking_travelers',
          filter: `job_id=eq.${jobId}`
        },
        () => {
          loadTravelers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const loadTravelers = async () => {
    try {
      const { data, error } = await supabase
        .from('group_booking_travelers')
        .select('*')
        .eq('job_id', jobId)
        .order('traveler_number');

      if (error) throw error;
      setTravelers(data || []);
    } catch (error: any) {
      console.error('Error loading travelers:', error);
      toast({
        title: "Error",
        description: "Failed to load payment status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (traveler: Traveler) => {
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          to: traveler.traveler_email,
          subject: 'Payment Reminder',
          html: `
            <h2>Payment Reminder</h2>
            <p>Hi ${traveler.traveler_name},</p>
            <p>This is a friendly reminder that your payment is still pending.</p>
            <p><strong>Amount due: ${traveler.currency} ${traveler.amount_owed.toFixed(2)}</strong></p>
            <a href="${traveler.stripe_payment_link}" style="display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Complete Payment
            </a>
          `
        }
      });

      toast({
        title: "Reminder Sent",
        description: `Payment reminder sent to ${traveler.traveler_name}`,
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div>Loading payment status...</div>;
  }

  const paidCount = travelers.filter(t => t.payment_status === 'paid').length;
  const totalCount = travelers.length;
  const progressPercentage = (paidCount / totalCount) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Payment Status</CardTitle>
        <CardDescription>
          {paidCount} of {totalCount} travelers have completed payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Payment Progress</span>
            <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Traveler List */}
        <div className="space-y-3">
          {travelers.map((traveler) => (
            <Card key={traveler.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{traveler.traveler_name}</h4>
                    {traveler.payment_status === 'paid' ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{traveler.traveler_email}</p>
                  <p className="text-sm font-medium mt-1">
                    {traveler.currency} {traveler.amount_owed.toFixed(2)}
                  </p>
                  {traveler.paid_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Paid on {new Date(traveler.paid_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {traveler.payment_status === 'pending' && (
                  <Button
                    onClick={() => sendReminder(traveler)}
                    variant="outline"
                    size="sm"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Reminder
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Summary Alert */}
        {paidCount === totalCount ? (
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              All payments received! Your booking is fully confirmed.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Waiting for {totalCount - paidCount} more payment(s) to confirm booking
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
