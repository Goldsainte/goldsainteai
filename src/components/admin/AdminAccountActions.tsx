import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MoreVertical, Ban, Pause, Trash2, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type ActionType = "suspend" | "ban" | "delete" | "reactivate";

interface AdminAccountActionsProps {
  userId: string;
  userName: string;
  currentStatus?: string | null;
  onStatusChange?: (userId: string, newStatus: string) => void;
  onDeleted?: (userId: string) => void;
}

const ACTION_CONFIG: Record<ActionType, { label: string; description: string; icon: typeof Ban; destructive: boolean }> = {
  suspend: { label: "Suspend account", description: "Temporarily suspend this account. The user won't be able to log in.", icon: Pause, destructive: true },
  ban: { label: "Ban account", description: "Permanently ban this account. This cannot be undone easily.", icon: Ban, destructive: true },
  delete: { label: "Delete account", description: "Permanently delete this account and all associated data. This action is irreversible.", icon: Trash2, destructive: true },
  reactivate: { label: "Reactivate account", description: "Restore this account to active status.", icon: RotateCcw, destructive: false },
};

export default function AdminAccountActions({ userId, userName, currentStatus, onStatusChange, onDeleted }: AdminAccountActionsProps) {
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isSuspendedOrBanned = currentStatus === "suspended" || currentStatus === "banned";

  async function handleConfirm() {
    if (!pendingAction) return;
    if (pendingAction !== "reactivate" && !reason.trim()) {
      toast({ title: "Reason required", description: "Please provide a reason for this action.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (pendingAction === "delete") {
        const { error } = await supabase.functions.invoke("admin-delete-account", {
          body: { targetUserId: userId, reason: reason.trim() },
        });
        if (error) throw error;
        onDeleted?.(userId);
        toast({ title: "Account deleted", description: `${userName}'s account has been permanently deleted.` });
      } else {
        const newStatus = pendingAction === "reactivate" ? "active" : pendingAction === "ban" ? "banned" : "suspended";

        const { error: profileError } = await supabase
          .from("profiles")
          .update({ account_status: newStatus })
          .eq("id", userId);
        if (profileError) throw profileError;

        if (pendingAction !== "reactivate") {
          const { error: modError } = await supabase.from("moderation_actions").insert({
            target_user_id: userId,
            action_type: pendingAction === "ban" ? "permanent_ban" : "temporary_ban",
            reason: reason.trim(),
            enforced_by_admin_id: (await supabase.auth.getUser()).data.user?.id ?? null,
            is_active: true,
            enforced_at: new Date().toISOString(),
            duration_hours: pendingAction === "suspend" ? 720 : null,
            expires_at: pendingAction === "suspend" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
          });
          if (modError) throw modError;
        } else {
          // Deactivate existing moderation actions
          await supabase
            .from("moderation_actions")
            .update({ is_active: false })
            .eq("target_user_id", userId)
            .eq("is_active", true);
        }

        onStatusChange?.(userId, newStatus);
        toast({ title: "Status updated", description: `${userName}'s account is now ${newStatus}.` });
      }
    } catch (err: any) {
      console.error("Admin action failed", err);
      toast({ title: "Action failed", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
      setPendingAction(null);
      setReason("");
    }
  }

  const config = pendingAction ? ACTION_CONFIG[pendingAction] : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="rounded-full p-1.5 hover:bg-[#E5DFC6]/50 transition-colors">
            <MoreVertical className="h-4 w-4 text-[#4a4a4a]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white border-[#E5DFC6] text-[#0a2225]">
          {isSuspendedOrBanned ? (
            <DropdownMenuItem onClick={() => setPendingAction("reactivate")} className="text-[#0c4d47] hover:bg-[#E3F2EF]">
              <RotateCcw className="mr-2 h-4 w-4 text-[#0c4d47]" />
              Reactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setPendingAction("suspend")} className="text-[#0a2225] hover:bg-[#F1EBDA]">
              <Pause className="mr-2 h-4 w-4" />
              Suspend
            </DropdownMenuItem>
          )}
          {!isSuspendedOrBanned && (
            <DropdownMenuItem onClick={() => setPendingAction("ban")} className="text-red-600 hover:bg-red-50">
              <Ban className="mr-2 h-4 w-4" />
              Ban
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="bg-[#E5DFC6]" />
          <DropdownMenuItem onClick={() => setPendingAction("delete")} className="text-red-600 hover:bg-red-50">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!pendingAction} onOpenChange={(open) => { if (!open) { setPendingAction(null); setReason(""); } }}>
        <AlertDialogContent className="bg-white border-[#E5DFC6]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0a2225]">{config?.label}</AlertDialogTitle>
            <AlertDialogDescription className="text-[#4a4a4a]">
              {config?.description}
              <br />
              <span className="font-semibold">User: {userName}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingAction !== "reactivate" && (
            <textarea
              placeholder="Reason for this action…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-sm text-[#0a2225] placeholder:text-[#4a4a4a]/60 focus:outline-none focus:ring-2 focus:ring-[#0c4d47]/30 min-h-[80px] resize-none"
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#E5DFC6] text-[#4a4a4a]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={loading}
              className={config?.destructive ? "bg-red-600 text-white hover:bg-red-700" : "bg-[#0c4d47] text-white hover:bg-[#0c4d47]/90"}
            >
              {loading ? "Processing…" : config?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
