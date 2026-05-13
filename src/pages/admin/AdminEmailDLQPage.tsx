import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, RotateCcw, X } from "lucide-react";

type DLQRow = {
  queue_name: string;
  msg_id: number;
  read_ct: number;
  enqueued_at: string;
  message: any;
};

export default function AdminEmailDLQPage() {
  const [rows, setRows] = useState<DLQRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("admin_list_email_dlq");
    if (error) {
      toast.error(`Failed to load DLQ: ${error.message}`);
    } else {
      setRows((data ?? []) as DLQRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const retry = async (row: DLQRow) => {
    const key = `${row.queue_name}-${row.msg_id}`;
    setBusyId(key);
    const { error } = await (supabase as any).rpc("admin_retry_email_dlq", {
      p_queue_name: row.queue_name,
      p_msg_id: row.msg_id,
    });
    setBusyId(null);
    if (error) {
      toast.error(`Retry failed: ${error.message}`);
    } else {
      toast.success("Re-queued for delivery");
      setRows((r) => r.filter((x) => !(x.queue_name === row.queue_name && x.msg_id === row.msg_id)));
    }
  };

  const dismiss = async (row: DLQRow) => {
    if (!confirm("Permanently dismiss this failed email?")) return;
    const key = `${row.queue_name}-${row.msg_id}`;
    setBusyId(key);
    const { error } = await (supabase as any).rpc("admin_dismiss_email_dlq", {
      p_queue_name: row.queue_name,
      p_msg_id: row.msg_id,
    });
    setBusyId(null);
    if (error) {
      toast.error(`Dismiss failed: ${error.message}`);
    } else {
      toast.success("Dismissed");
      setRows((r) => r.filter((x) => !(x.queue_name === row.queue_name && x.msg_id === row.msg_id)));
    }
  };

  return (
    <div className="container max-w-6xl py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Email Dead Letter Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Emails that failed after all retries. Retry to re-send, or dismiss to discard.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No failed emails. Inbox is clean.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const key = `${row.queue_name}-${row.msg_id}`;
            const recipient =
              row.message?.payload?.to ||
              row.message?.payload?.recipient_email ||
              row.message?.to ||
              "—";
            const template =
              row.message?.payload?.template_name ||
              row.message?.template_name ||
              row.message?.payload?.subject ||
              "—";
            return (
              <div
                key={key}
                className="rounded-lg border border-border bg-card p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{row.queue_name}</Badge>
                    <span className="text-sm font-medium text-foreground truncate">{template}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    To: <span className="text-foreground">{String(recipient)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Failed {new Date(row.enqueued_at).toLocaleString()} · {row.read_ct} attempts
                  </div>
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer">Payload</summary>
                    <pre className="mt-2 text-xs bg-muted/40 p-2 rounded overflow-auto max-h-48">
                      {JSON.stringify(row.message, null, 2)}
                    </pre>
                  </details>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => retry(row)}
                    disabled={busyId === key}
                  >
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Retry
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismiss(row)}
                    disabled={busyId === key}
                  >
                    <X className="mr-2 h-3 w-3" />
                    Dismiss
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}