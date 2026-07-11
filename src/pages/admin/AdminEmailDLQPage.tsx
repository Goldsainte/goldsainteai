import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { confirmDialog } from "@/components/ui/confirm-dialog";
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
    const ok = await confirmDialog({
      title: "Permanently dismiss this failed email?",
      description: "It will be removed from the dead-letter queue.",
      confirmText: "Dismiss",
      destructive: true,
    });
    if (!ok) return;
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
    <main className="min-h-screen bg-[#f7f3ea] px-5 py-10 md:px-6">
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Trust &amp; systems</p>
          <h1 className="mt-2 font-secondary text-[28px] leading-tight text-[#0a2225] md:text-[30px]">Email queue</h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#0a2225]/55">
            Emails that failed after all retries — retry to re-send, or dismiss to discard.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-[#C7A962]/50 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8D6B2F] transition-colors hover:bg-[#C7A962]/10 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#0a2225]/45">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
          <p className="text-[14px] text-[#0a2225]/55">No failed emails — every message found its way.</p>
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
                className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.07)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex rounded-full border border-[#E5DFC6] bg-[#fdfaf2] px-2.5 py-0.5 text-[10.5px] text-[#0a2225]/60">{row.queue_name}</span>
                    <span className="truncate text-sm font-medium text-[#0a2225]">{template}</span>
                  </div>
                  <div className="text-sm text-[#0a2225]/55">
                    To: <span className="text-[#0a2225]">{String(recipient)}</span>
                  </div>
                  <div className="mt-1 text-xs text-[#0a2225]/45">
                    Failed {new Date(row.enqueued_at).toLocaleString()} · {row.read_ct} attempts
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-[#8D6B2F]">Payload</summary>
                    <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-[#E5DFC6] bg-[#fdfaf2] p-2 text-xs">
                      {JSON.stringify(row.message, null, 2)}
                    </pre>
                  </details>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => retry(row)}
                    disabled={busyId === key}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0c4d47] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:opacity-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => dismiss(row)}
                    disabled={busyId === key}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#0a2225]/20 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#0a2225]/60 transition-colors hover:bg-[#f7f3ea] disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </main>
  );
}
