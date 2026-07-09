import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileText, PenLine, Download, ArrowRight, Loader2 } from "lucide-react";

type ContractRow = { id: string; status: string; trip_id: string | null };

/**
 * Fetches the contract PDF from generate-signed-contract and triggers a
 * browser download. Returns true on success. Shared by ContractStatusCard
 * and ContractSignPage.
 */
export async function downloadContractPdf(contractId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "generate-signed-contract",
      { body: { contractId } },
    );
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (!data?.pdf_base64) throw new Error("No PDF returned");
    const bin = atob(data.pdf_base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      data.filename || `Goldsainte-Contract-${contractId.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error("Contract PDF download failed", e);
    return false;
  }
}

const CHIP: Record<string, { label: string; cls: string }> = {
  none: { label: "Not created", cls: "border border-[#0a2225]/15 bg-white text-[#0a2225]/55" },
  draft: { label: "Draft", cls: "border border-[#0a2225]/20 bg-[#0a2225]/[0.04] text-[#0a2225]/70" },
  pending_signatures: { label: "Awaiting signature", cls: "border border-[#C7A962]/50 bg-[#C7A962]/15 text-[#8D6B2F]" },
  fully_executed: { label: "Signed", cls: "border border-[#0c4d47]/30 bg-[#0c4d47]/[0.08] text-[#0c4d47]" },
  expired: { label: "Expired", cls: "border border-[#0a2225]/15 bg-white text-[#0a2225]/45" },
  terminated: { label: "Terminated", cls: "border border-[#8b3a3a]/30 bg-[#8b3a3a]/[0.06] text-[#8b3a3a]" },
};

type Props = {
  variant: "agent" | "traveler";
  bookingId: string;
  /** agent variant: needed to create a contract + trips row */
  travelerId?: string | null;
  partnerRole?: string | null;
  tripTitle?: string | null;
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export function ContractStatusCard({
  variant,
  bookingId,
  travelerId,
  partnerRole,
  tripTitle,
  destination,
  startDate,
  endDate,
}: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<ContractRow | null>(null);
  const [busy, setBusy] = useState<null | "create" | "download">(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("trip_contracts")
          .select("id, status, trip_id")
          .eq("booking_id", bookingId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        let row = (data as ContractRow | null) ?? null;

        // Agent fallback: an unlinked contract for this traveler pair
        // (mirrors the lazy auto-link in trip-checkout-create).
        if (!row && variant === "agent" && travelerId) {
          const { data: auth } = await supabase.auth.getUser();
          const uid = auth?.user?.id;
          if (uid) {
            const { data: fallback } = await supabase
              .from("trip_contracts")
              .select("id, status, trip_id")
              .eq("traveler_id", travelerId)
              .eq("agent_id", uid)
              .is("booking_id", null)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            row = (fallback as ContractRow | null) ?? null;
          }
        }
        if (alive) setContract(row);
      } catch (e) {
        console.error("Contract lookup failed", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [bookingId, travelerId, variant]);

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCreate = async (e: React.MouseEvent) => {
    stop(e);
    if (busy) return;
    setBusy("create");
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) throw new Error("Not signed in");
      if (!travelerId) throw new Error("Missing traveler");
      const { data: trip, error } = await supabase
        .from("trips")
        .insert({
          traveler_id: travelerId,
          title: tripTitle || destination || "Trip",
          destination: destination || null,
          start_date: startDate || null,
          end_date: endDate || null,
          status: "matched",
        })
        .select("id")
        .single();
      if (error) throw error;
      navigate(`/agent/trips/${trip.id}/contract?bookingId=${bookingId}`);
    } catch (err) {
      console.error("Create contract failed", err);
      setBusy(null);
    }
  };

  const handleContinue = (e: React.MouseEvent) => {
    stop(e);
    if (contract?.trip_id) {
      navigate(`/agent/trips/${contract.trip_id}/contract?bookingId=${bookingId}`);
    }
  };

  const handleView = (e: React.MouseEvent) => {
    stop(e);
    if (contract) navigate(`/contract/${contract.id}/sign?type=${variant}`);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    stop(e);
    if (!contract || busy) return;
    setBusy("download");
    await downloadContractPdf(contract.id);
    setBusy(null);
  };

  const status = contract?.status ?? "none";
  const chip = CHIP[status] ?? CHIP.none;

  const pill =
    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors disabled:opacity-50";
  const goldBtn = `${pill} border border-[#C7A962]/60 bg-[#C7A962]/10 text-[#8D6B2F] hover:bg-[#C7A962]/20`;
  const forestBtn = `${pill} bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#0a2225]`;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#0a2225]/10 bg-[#fdfaf2] px-3.5 py-2.5">
      <span className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-[#8D6B2F]" />
        <span className="text-[10px] uppercase tracking-[0.22em] text-[#8D6B2F]">
          Contract
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.1em] ${chip.cls}`}
        >
          {loading ? "…" : chip.label}
        </span>
      </span>

      {!loading && (
        <span className="flex items-center gap-2">
          {variant === "agent" && status === "none" && partnerRole !== "creator" && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy === "create"}
              className={forestBtn}
            >
              {busy === "create" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PenLine className="h-3.5 w-3.5" />
              )}
              Create contract
            </button>
          )}
          {variant === "agent" && status === "draft" && (
            <button type="button" onClick={handleContinue} className={forestBtn}>
              Continue contract <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {status === "pending_signatures" && variant === "traveler" && (
            <button type="button" onClick={handleView} className={forestBtn}>
              Review &amp; sign <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {status === "pending_signatures" && variant === "agent" && (
            <button type="button" onClick={handleView} className={goldBtn}>
              View contract
            </button>
          )}
          {status === "fully_executed" && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={busy === "download"}
              className={goldBtn}
            >
              {busy === "download" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Download PDF
            </button>
          )}
        </span>
      )}
    </div>
  );
}
