import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface Participant {
  email: string;
  name: string;
  amount: number;
}

interface GroupBookingForm {
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  currency: string;
  paymentDeadline: string;
}

export const GroupBookingCreator = () => {
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([
    { email: "", name: "", amount: 0 }
  ]);
  const [isCreating, setIsCreating] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<GroupBookingForm>();

  const totalAmount = watch("totalAmount") || 0;

  const addParticipant = () => {
    setParticipants([...participants, { email: "", name: "", amount: 0 }]);
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string | number) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const distributeEvenly = () => {
    if (participants.length === 0 || totalAmount === 0) return;
    const perPerson = totalAmount / participants.length;
    setParticipants(participants.map(p => ({ ...p, amount: perPerson })));
  };

  const onSubmit = async (data: GroupBookingForm) => {
    setIsCreating(true);

    try {
      // Validate participants
      const validParticipants = participants.filter(p => p.email && p.amount > 0);
      if (validParticipants.length === 0) {
        toast({
          title: "No participants",
          description: "Add at least one participant with an email and amount",
          variant: "destructive"
        });
        return;
      }

      const totalParticipantAmount = validParticipants.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalParticipantAmount - data.totalAmount) > 0.01) {
        toast({
          title: "Amount mismatch",
          description: `Participant amounts (${totalParticipantAmount}) don't match total (${data.totalAmount})`,
          variant: "destructive"
        });
        return;
      }

      // Create group booking
      const { data: booking, error: bookingError } = await (supabase as any)
        .from('group_bookings')
        .insert({
          title: data.title,
          description: data.description,
          destination: data.destination,
          start_date: data.startDate,
          end_date: data.endDate,
          total_amount: data.totalAmount,
          currency: data.currency,
          payment_deadline: data.paymentDeadline,
          status: "pending",
          organizer_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Add participants
      const { error: participantsError } = await (supabase as any)
        .from("group_participants")
        .insert(
          validParticipants.map(p => ({
            booking_id: booking.id,
            participant_email: p.email,
            participant_name: p.name,
            amount_due: p.amount,
            payment_status: "pending"
          }))
        );

      if (participantsError) throw participantsError;

      // Generate payment links
      await supabase.functions.invoke("create-group-payment-links", {
        body: { bookingId: booking.id }
      });

      toast({
        title: "Group booking created!",
        description: "Payment links have been sent to all participants"
      });

      // Reset form
      setParticipants([{ email: "", name: "", amount: 0 }]);
    } catch (error: any) {
      toast({
        title: "Error creating booking",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Group Booking</CardTitle>
        <CardDescription>
          Split travel costs with friends and family
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Trip Title</Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
                placeholder="Weekend in Miami"
              />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Beach getaway with friends..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  {...register("destination", { required: "Destination is required" })}
                  placeholder="Miami, FL"
                />
                {errors.destination && <p className="text-sm text-destructive mt-1">{errors.destination.message}</p>}
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  {...register("currency")}
                  defaultValue="USD"
                  placeholder="USD"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate", { required: "Start date is required" })}
                />
                {errors.startDate && <p className="text-sm text-destructive mt-1">{errors.startDate.message}</p>}
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate", { required: "End date is required" })}
                />
                {errors.endDate && <p className="text-sm text-destructive mt-1">{errors.endDate.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalAmount">Total Amount</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  {...register("totalAmount", { 
                    required: "Total amount is required",
                    min: { value: 0.01, message: "Amount must be positive" }
                  })}
                  placeholder="0.00"
                />
                {errors.totalAmount && <p className="text-sm text-destructive mt-1">{errors.totalAmount.message}</p>}
              </div>

              <div>
                <Label htmlFor="paymentDeadline">Payment Deadline</Label>
                <Input
                  id="paymentDeadline"
                  type="datetime-local"
                  {...register("paymentDeadline", { required: "Payment deadline is required" })}
                />
                {errors.paymentDeadline && <p className="text-sm text-destructive mt-1">{errors.paymentDeadline.message}</p>}
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Participants</Label>
              <Button type="button" variant="outline" size="sm" onClick={distributeEvenly}>
                Split Evenly
              </Button>
            </div>

            {participants.map((participant, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="Email"
                    value={participant.email}
                    onChange={(e) => updateParticipant(index, "email", e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="Name (optional)"
                    value={participant.name}
                    onChange={(e) => updateParticipant(index, "name", e.target.value)}
                  />
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={participant.amount || ""}
                    onChange={(e) => updateParticipant(index, "amount", parseFloat(e.target.value) || 0)}
                  />
                </div>
                {participants.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeParticipant(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addParticipant} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Participant
            </Button>
          </div>

          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating ? "Creating..." : "Create Group Booking"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
