import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { Loader2 } from "lucide-react";

interface RequestTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  creatorName: string;
}

const BUDGET_OPTIONS = [
  { value: "under_2k", label: "Under $2,000" },
  { value: "2k_5k", label: "$2,000 – $5,000" },
  { value: "5k_10k", label: "$5,000 – $10,000" },
  { value: "10k_plus", label: "$10,000+" },
];

export function RequestTripModal({
  open,
  onOpenChange,
  creatorId,
  creatorName,
}: RequestTripModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [budget, setBudget] = useState("");
  const [preferences, setPreferences] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.info("Please sign in to request a trip");
      navigate("/auth");
      return;
    }

    if (!destination.trim()) {
      toast.error("Please enter a destination");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("agent_inquiries").insert({
        user_id: user.id,
        inquiry_source: "creator_profile",
        status: "new",
        assigned_agent_id: creatorId,
        conversation_data: {
          destination,
          dates: dateRange
            ? {
                from: dateRange.from?.toISOString(),
                to: dateRange.to?.toISOString(),
              }
            : null,
          budget,
          preferences,
          creator_name: creatorName,
        },
      });

      if (error) throw error;

      toast.success("Trip request sent!", {
        description: `${creatorName} will review your request and get back to you.`,
      });
      onOpenChange(false);
      setDestination("");
      setDateRange(undefined);
      setBudget("");
      setPreferences("");
    } catch (err) {
      console.error("Failed to submit trip request:", err);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="font-secondary text-xl text-[#0a2225]">
            Get a Custom Itinerary from {creatorName}
          </DialogTitle>
          <DialogDescription className="text-[#6B7280]">
            Tell us your preferences and get a custom itinerary.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-medium text-[#0a2225] mb-1.5 block">
              Destination *
            </label>
            <Input
              placeholder="e.g. Bali, Amalfi Coast, Kenya Safari"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="border-[#E5DFC6]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#0a2225] mb-1.5 block">
              Travel Dates
            </label>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#0a2225] mb-1.5 block">
              Budget Range
            </label>
            <Select value={budget} onValueChange={setBudget}>
              <SelectTrigger className="border-[#E5DFC6]">
                <SelectValue placeholder="Select budget range" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-[#0a2225] mb-1.5 block">
              Preferences & Notes
            </label>
            <Textarea
              placeholder="What kind of experience are you looking for? Any special occasions, group size, must-haves?"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              rows={3}
              className="border-[#E5DFC6] resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-xl h-11 font-medium"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send Trip Request"
            )}
          </Button>

          <p className="text-[10px] text-center text-[#6B7280]">
            Your request is secure. {creatorName} typically responds within 24 hours.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
