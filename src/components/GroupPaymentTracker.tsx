import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Clock, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface GroupBooking {
  id: string;
  title: string;
  destination: string;
  total_amount: number;
  currency: string;
  payment_deadline: string;
  status: string;
}

interface Participant {
  id: string;
  participant_email: string;
  participant_name: string;
  amount_due: number;
  payment_status: string;
  paid_at: string | null;
}

export const GroupPaymentTracker = ({ bookingId }: { bookingId: string }) => {
  const { toast } = useToast();
  const [booking, setBooking] = useState<GroupBooking | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingData();

    // Real-time subscription for payment updates
    const channel = supabase
      .channel(`group-booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_participants',
          filter: `booking_id=eq.${bookingId}`
        },
        () => {
          fetchBookingData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const fetchBookingData = async () => {
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from("group_bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;
      setBooking(bookingData);

      const { data: participantsData, error: participantsError } = await supabase
        .from("group_participants")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at");

      if (participantsError) throw participantsError;
      setParticipants(participantsData);
    } catch (error: any) {
      toast({
        title: "Error loading booking",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resendPaymentLink = async (participantId: string) => {
    try {
      await supabase.functions.invoke("resend-payment-link", {
        body: { participantId }
      });

      toast({
        title: "Payment link sent",
        description: "The participant will receive an email shortly"
      });
    } catch (error: any) {
      toast({
        title: "Error sending link",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!booking) {
    return <div>Booking not found</div>;
  }

  const paidCount = participants.filter(p => p.payment_status === "paid").length;
  const totalPaid = participants
    .filter(p => p.payment_status === "paid")
    .reduce((sum, p) => sum + p.amount_due, 0);
  const progressPercent = (totalPaid / booking.total_amount) * 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      pending: "secondary",
      failed: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{booking.title}</CardTitle>
            <CardDescription>
              {booking.destination} • {paidCount}/{participants.length} paid
            </CardDescription>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payment Progress</span>
            <span className="font-medium">
              {booking.currency} {totalPaid.toFixed(2)} / {booking.total_amount.toFixed(2)}
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-xs text-muted-foreground">
            Payment deadline: {new Date(booking.payment_deadline).toLocaleDateString()}
          </p>
        </div>

        {/* Participants List */}
        <div className="space-y-3">
          <h3 className="font-semibold">Participants</h3>
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(participant.payment_status)}
                <div>
                  <p className="font-medium">
                    {participant.participant_name || participant.participant_email}
                  </p>
                  {participant.participant_name && (
                    <p className="text-sm text-muted-foreground">
                      {participant.participant_email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">
                    {booking.currency} {participant.amount_due.toFixed(2)}
                  </p>
                  {participant.paid_at && (
                    <p className="text-xs text-muted-foreground">
                      Paid {new Date(participant.paid_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {participant.payment_status === "pending" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resendPaymentLink(participant.id)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Resend
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {progressPercent === 100 && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              ✓ All payments received! Your group booking is confirmed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
