import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TripRequestStatus,
  TripRole,
  getAvailableTransitions,
} from "@/lib/trips/statusMachine";
import { toast } from "sonner";

interface TripStatusControlsProps {
  tripRequestId: string;
  status: TripRequestStatus;
  role: TripRole;
  onStatusChange?: (newStatus: TripRequestStatus) => void;
}

export function TripStatusControls({
  tripRequestId,
  status,
  role,
  onStatusChange,
}: TripStatusControlsProps) {
  const [updating, setUpdating] = useState(false);

  const statusLabel: Record<TripRequestStatus, string> = {
    open: "Open",
    matched: "Matched",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const statusColor: Record<TripRequestStatus, string> = {
    open: "bg-emerald-50 text-emerald-800 border-emerald-200",
    matched: "bg-[#F0F7F6] text-[#0c4d47] border-[#0c4d47]/20",
    in_progress: "bg-amber-50 text-amber-800 border-amber-200",
    completed: "bg-slate-50 text-slate-800 border-slate-200",
    cancelled: "bg-red-50 text-red-800 border-red-200",
  };

  const nextStatuses = getAvailableTransitions(status, role);

  const handleChange = async (next: TripRequestStatus) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("trip_requests")
        .update({ status: next })
        .eq("id", tripRequestId);

      if (error) throw error;

      toast.success(`Status updated to ${statusLabel[next]}`);
      onStatusChange?.(next);
    } catch (err) {
      console.error("Failed to update trip status", err);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge className={`border px-2 py-0.5 text-[11px] ${statusColor[status]}`}>
        {statusLabel[status]}
      </Badge>

      {nextStatuses.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {nextStatuses.map((next) => (
            <Button
              key={next}
              size="sm"
              variant="outline"
              disabled={updating}
              className="h-7 text-[10px] uppercase tracking-wide"
              onClick={() => handleChange(next)}
            >
              Set {statusLabel[next]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
