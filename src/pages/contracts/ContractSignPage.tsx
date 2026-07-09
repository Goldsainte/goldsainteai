import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { downloadContractPdf } from "@/components/contracts/ContractStatusCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Pencil,
  MessageSquareWarning,
  ShieldCheck,
  Loader2,
  Download,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SignaturePad from "react-signature-canvas";

// =====================================================================
// Types — mirror the JSONB shape stored by AgentContractBuilder
// =====================================================================
type ContractSection = {
  id: string;
  title: string;
  content: string;
  fields?: { name: string; value: string; required?: boolean }[];
};

type ContractRow = {
  id: string;
  trip_id: string;
  booking_id: string | null;
  agent_id: string;
  traveler_id: string;
  creator_id: string | null;
  contract_sections: ContractSection[];
  source_type?: string | null;
  uploaded_pdf_path?: string | null;
  traveler_info: Record<string, any>;
  trip_info: Record<string, any>;
  field_values: Record<string, string>;
  agent_signature: string | null;
  traveler_signature: string | null;
  agent_signed_at: string | null;
  traveler_signed_at: string | null;
  status:
    | "draft"
    | "pending_signatures"
    | "fully_executed"
    | "expired"
    | "terminated";
};

type Revision = {
  id: string;
  contract_id: string;
  proposed_by: string;
  proposed_by_role: "agent" | "traveler" | "creator";
  changes: Record<string, string>;
  message: string | null;
  status: "pending" | "accepted" | "rejected" | "superseded";
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_message: string | null;
  created_at: string;
};

type Role = "agent" | "traveler" | "creator" | null;

// =====================================================================
// Component
// =====================================================================
export default function ContractSignPage() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState<ContractRow | null>(null);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Role>(null);

  // Edit state for proposing revisions
  const [editMode, setEditMode] = useState(false);
  const [editedFieldValues, setEditedFieldValues] = useState<
    Record<string, string>
  >({});
  const [revisionMessage, setRevisionMessage] = useState("");

  // Signature state
  const [signatureMode, setSignatureMode] = useState(false);
  const [signature, setSignature] = useState("");
  const [signaturePadRef, setSignaturePadRef] = useState<any>(null);

  // Reject revision dialog
  const [revisionToReject, setRevisionToReject] = useState<string | null>(null);
  const [rejectMessage, setRejectMessage] = useState("");

  useEffect(() => {
    if (contractId) {
      loadContract();
    }
  }, [contractId]);

  async function loadContract() {
    if (!contractId) return;
    setLoading(true);
    try {
      // Auth
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth/login?redirect=" + window.location.pathname);
        return;
      }
      setCurrentUserId(user.id);

      // Contract (RLS limits this to parties on the contract)
      const { data: contractData, error: contractError } = await supabase
        .from("trip_contracts")
        .select("*")
        .eq("id", contractId)
        .single();

      if (contractError || !contractData) {
        toast({
          variant: "destructive",
          title: "Contract not found",
          description:
            "Either this contract doesn't exist or you don't have access to it.",
        });
        navigate("/my-bookings");
        return;
      }

      setContract(contractData as unknown as ContractRow);

      const uploadedPath = (contractData as any)?.uploaded_pdf_path;
      if ((contractData as any)?.source_type === "uploaded" && uploadedPath) {
        const { data: signed } = await supabase.storage
          .from("contracts")
          .createSignedUrl(uploadedPath, 3600);
        setUploadedPdfUrl(signed?.signedUrl ?? null);
      }
      setEditedFieldValues({
        ...(contractData.field_values as Record<string, string>),
      });

      // Determine the current user's role on this contract
      if (user.id === contractData.traveler_id) setUserRole("traveler");
      else if (user.id === contractData.agent_id) setUserRole("agent");
      else if (user.id === contractData.creator_id) setUserRole("creator");
      else setUserRole(null);

      // Revisions
      const { data: revisionsData } = await (supabase as any)
        .from("trip_contract_revisions")
        .select("*")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false });

      setRevisions((revisionsData ?? []) as unknown as Revision[]);
    } catch (err: any) {
      console.error("Error loading contract:", err);
      toast({
        variant: "destructive",
        title: "Failed to load contract",
        description: err.message ?? "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------
  // Propose a revision
  // -------------------------------------------------------------------
  async function handleProposeRevision() {
    if (!contract || !currentUserId || !userRole) return;

    // Compute the diff: only include fields that the user actually changed
    const changes: Record<string, string> = {};
    for (const [k, v] of Object.entries(editedFieldValues)) {
      if (contract.field_values[k] !== v) {
        changes[k] = v;
      }
    }

    if (Object.keys(changes).length === 0) {
      toast({
        title: "No changes to propose",
        description:
          "You haven't modified any fields. Edit a value first, then propose.",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any).from("trip_contract_revisions").insert({
        contract_id: contract.id,
        proposed_by: currentUserId,
        proposed_by_role: userRole,
        changes,
        message: revisionMessage.trim() || null,
        status: "pending",
      });
      if (error) throw error;

      toast({
        title: "Changes proposed",
        description:
          "The other party will be notified and can accept or reject your proposed changes.",
      });
      setEditMode(false);
      setRevisionMessage("");
      await loadContract();
    } catch (err: any) {
      console.error("Error proposing revision:", err);
      toast({
        variant: "destructive",
        title: "Failed to propose changes",
        description: err.message ?? "An unexpected error occurred.",
      });
    } finally {
      setSaving(false);
    }
  }

  // -------------------------------------------------------------------
  // Accept a pending revision (must be the OTHER party, not the proposer)
  // The DB trigger handles merging the changes into field_values and
  // clearing any existing signatures.
  // -------------------------------------------------------------------
  async function handleAcceptRevision(revisionId: string) {
    if (!currentUserId) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("trip_contract_revisions")
        .update({
          status: "accepted",
          resolved_by: currentUserId,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", revisionId);
      if (error) throw error;

      toast({
        title: "Changes accepted",
        description:
          "The contract has been updated. Both parties will need to sign again.",
      });
      await loadContract();
    } catch (err: any) {
      console.error("Error accepting revision:", err);
      toast({
        variant: "destructive",
        title: "Failed to accept changes",
        description: err.message ?? "An unexpected error occurred.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRejectRevision() {
    if (!revisionToReject || !currentUserId) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("trip_contract_revisions")
        .update({
          status: "rejected",
          resolved_by: currentUserId,
          resolved_at: new Date().toISOString(),
          resolution_message: rejectMessage.trim() || null,
        })
        .eq("id", revisionToReject);
      if (error) throw error;

      toast({
        title: "Changes rejected",
        description: "The proposed changes were not applied.",
      });
      setRevisionToReject(null);
      setRejectMessage("");
      await loadContract();
    } catch (err: any) {
      console.error("Error rejecting revision:", err);
      toast({
        variant: "destructive",
        title: "Failed to reject changes",
        description: err.message ?? "An unexpected error occurred.",
      });
    } finally {
      setSaving(false);
    }
  }

  // -------------------------------------------------------------------
  // Sign the contract. Updates the role-specific signature columns.
  // The DB trigger auto-promotes status to 'fully_executed' once both
  // sides have signed.
  // -------------------------------------------------------------------
  async function handleSign() {
    if (!contract || !signature || !userRole) {
      toast({
        variant: "destructive",
        title: "Signature required",
        description: "Please draw your signature before submitting.",
      });
      return;
    }

    // Block signing if there are pending revisions
    const hasPendingRevisions = revisions.some((r) => r.status === "pending");
    if (hasPendingRevisions) {
      toast({
        variant: "destructive",
        title: "Pending revisions",
        description:
          "Resolve all pending revisions before signing the contract.",
      });
      return;
    }

    setSaving(true);
    try {
      const updates: Record<string, any> = {};
      const now = new Date().toISOString();
      if (userRole === "traveler") {
        updates.traveler_signature = signature;
        updates.traveler_signed_at = now;
      } else if (userRole === "creator") {
        updates.creator_signature = signature;
        updates.creator_signed_at = now;
      } else if (userRole === "agent") {
        updates.agent_signature = signature;
        updates.agent_signed_at = now;
      }

      const { error } = await supabase
        .from("trip_contracts")
        .update(updates)
        .eq("id", contract.id);
      if (error) throw error;

      toast({
        title: "Contract signed",
        description:
          "Your signature has been recorded. If both parties have signed, you'll be able to proceed to deposit.",
      });
      setSignatureMode(false);
      setSignature("");
      await loadContract();
    } catch (err: any) {
      console.error("Error signing contract:", err);
      toast({
        variant: "destructive",
        title: "Failed to record signature",
        description: err.message ?? "An unexpected error occurred.",
      });
    } finally {
      setSaving(false);
    }
  }

  // -------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------
  function fieldLabel(name: string) {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase());
  }

  function statusBadge(status: ContractRow["status"]) {
    const map: Record<ContractRow["status"], { label: string; cls: string }> = {
      draft: { label: "Draft", cls: "bg-muted text-muted-foreground" },
      pending_signatures: {
        label: "Awaiting signatures",
        cls: "bg-amber-100 text-amber-900",
      },
      fully_executed: {
        label: "Fully executed",
        cls: "bg-green-100 text-green-900",
      },
      expired: { label: "Expired", cls: "bg-muted text-muted-foreground" },
      terminated: {
        label: "Terminated",
        cls: "bg-red-100 text-red-900",
      },
    };
    const { label, cls } = map[status];
    return <Badge className={cls}>{label}</Badge>;
  }

  // -------------------------------------------------------------------
  // Loading / not-found / not-authorized
  // -------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading contract…</p>
        </div>
      </div>
    );
  }

  if (!contract || !userRole) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Not authorized</CardTitle>
            <CardDescription>
              You don't have permission to view this contract.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/my-bookings")}>
              Back to my bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasSigned = (() => {
    if (userRole === "traveler") return !!contract.traveler_signed_at;
    if (userRole === "agent") return !!contract.agent_signed_at;
    return false;
  })();
  const pendingRevisions = revisions.filter((r) => r.status === "pending");

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f7f3ea]">
      {/* Command bar — two-tier */}
      <div className="sticky top-0 z-40 shadow-[0_2px_16px_rgba(10,34,37,0.28)]">
        <div className="bg-gradient-to-r from-[#0c4d47] to-[#0a2225]">
          <div className="mx-auto flex h-[72px] max-w-4xl items-center gap-4 px-4 md:px-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[#E5DFC6]/28 text-[#E5DFC6] transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] uppercase tracking-[0.3em] text-[#C7A962]">
                Trip Service Agreement
              </p>
              <h1 className="truncate font-secondary text-[23px] leading-tight text-[#fdfaf2]">
                {contract.trip_info?.destination ?? "Your Trip"}
              </h1>
            </div>
            {contract.status === "fully_executed" ? (
              <button
                type="button"
                onClick={() => downloadContractPdf(contract.id)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#C7A962] px-6 py-3 text-[13px] font-medium uppercase tracking-[0.1em] text-[#0a2225] transition-colors hover:bg-[#d9bd7d]"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
            ) : (
              <span className="shrink-0 rounded-full border border-[#E5DFC6]/35 px-4 py-2 text-[10.5px] uppercase tracking-[0.16em] text-[#E5DFC6]">
                {String(contract.status).replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>
        <div className="border-t border-white/10 bg-[#083530]">
          <div className="mx-auto flex h-[46px] max-w-4xl items-center gap-6 px-4 md:px-6">
            <span className="flex items-center gap-2 text-[13px] text-[#E5DFC6]/78">
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#C7A962] text-[11px] font-semibold text-[#0a2225]">
                {String((contract.field_values as any)?.agentName || "A").trim().charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:inline">{(contract.field_values as any)?.agentName || "Agent"}</span>
              <span className={`h-[9px] w-[9px] rounded-full ${contract.agent_signed_at ? "bg-[#C7A962]" : "bg-[#E5DFC6]/25"}`} />
            </span>
            <span className="flex items-center gap-2 text-[13px] text-[#E5DFC6]/78">
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#C7A962] text-[11px] font-semibold text-[#0a2225]">
                {String(contract.traveler_info?.firstName || "T").trim().charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:inline">
                {`${contract.traveler_info?.firstName ?? ""} ${contract.traveler_info?.lastName ?? ""}`.trim() || "Traveler"}
              </span>
              <span className={`h-[9px] w-[9px] rounded-full ${contract.traveler_signed_at ? "bg-[#C7A962]" : "bg-[#E5DFC6]/25"}`} />
            </span>
            {contract.creator_id && (
              <span className="flex items-center gap-2 text-[13px] text-[#E5DFC6]/78">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#C7A962] text-[11px] font-semibold text-[#0a2225]">C</span>
                <span className="hidden sm:inline">Creator</span>
                <span className={`h-[9px] w-[9px] rounded-full ${contract.creator_signed_at ? "bg-[#C7A962]" : "bg-[#E5DFC6]/25"}`} />
              </span>
            )}
            <div className="flex-1" />
            {contract.status === "fully_executed" ? (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#C7A962]">
                <CheckCircle2 className="h-4 w-4" /> Fully executed
              </span>
            ) : hasSigned ? (
              <span className="text-[12.5px] text-[#E5DFC6]/78">Waiting for the other party</span>
            ) : (
              <span className="text-[12.5px] text-[#E5DFC6]/78">Awaiting your signature</span>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* Fully executed banner */}
        {contract.status === "fully_executed" && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-3 py-4">
              <ShieldCheck className="h-6 w-6 text-green-700 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-green-900">
                  This contract is fully executed.
                </p>
                <p className="text-sm text-green-800">
                  Both parties have signed. You can now proceed to deposit.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => downloadContractPdf(contract.id)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              {contract.booking_id && (
                <Button
                  onClick={() =>
                    navigate(`/bookings/${contract.booking_id}`)
                  }
                  className="gap-2"
                >
                  Continue to deposit
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending revisions panel */}
        {pendingRevisions.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <MessageSquareWarning className="h-5 w-5" />
                Pending revisions ({pendingRevisions.length})
              </CardTitle>
              <CardDescription className="text-amber-900/80">
                The contract cannot be signed until all pending revisions are
                resolved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingRevisions.map((rev) => {
                const isMine = rev.proposed_by === currentUserId;
                return (
                  <div
                    key={rev.id}
                    className="rounded-lg border border-amber-300 bg-white p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-medium">
                          {isMine
                            ? "Your proposed changes"
                            : `Proposed by the ${rev.proposed_by_role}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(rev.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!isMine && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRevisionToReject(rev.id)}
                            disabled={saving}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRevision(rev.id)}
                            disabled={saving}
                          >
                            Accept
                          </Button>
                        </div>
                      )}
                    </div>
                    {rev.message && (
                      <p className="text-sm italic text-muted-foreground">
                        "{rev.message}"
                      </p>
                    )}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Changes:
                      </p>
                      {Object.entries(rev.changes).map(([k, v]) => (
                        <div
                          key={k}
                          className="text-sm grid grid-cols-[180px_1fr] gap-3"
                        >
                          <span className="font-medium">{fieldLabel(k)}:</span>
                          <span>
                            <span className="line-through text-muted-foreground">
                              {contract.field_values[k] || "(empty)"}
                            </span>
                            <span className="mx-2">→</span>
                            <span className="font-medium">{v}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Contract sections */}
        {contract.source_type === "uploaded" ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Agreement Document</CardTitle>
              <CardDescription>
                This agreement was provided by your travel specialist. Review the full document below, then sign underneath.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedPdfUrl ? (
                <>
                  <div className="mb-3 flex justify-end">
                    <a
                      href={uploadedPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full bg-[#0c4d47] px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
                    >
                      Open in new tab
                    </a>
                  </div>
                  <iframe
                    src={uploadedPdfUrl}
                    title="Contract document"
                    className="h-[720px] w-full rounded-lg border"
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading document…</p>
              )}
            </CardContent>
          </Card>
        ) : (
        <div className="space-y-6 mb-8">
          {contract.contract_sections.map((section, index) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="text-xl">
                  {index + 1}. {section.title}
                </CardTitle>
                <CardDescription>{section.content}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.fields?.map((field) => {
                  const isMultiline =
                    field.name.includes("Description") ||
                    field.name.includes("Terms") ||
                    field.name.includes("Policy") ||
                    field.name.includes("Duties");
                  const currentValue =
                    editMode
                      ? editedFieldValues[field.name] ?? field.value
                      : contract.field_values[field.name] ?? field.value;
                  return (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>{fieldLabel(field.name)}</Label>
                      {editMode ? (
                        isMultiline ? (
                          <Textarea
                            id={field.name}
                            value={currentValue}
                            rows={3}
                            onChange={(e) =>
                              setEditedFieldValues({
                                ...editedFieldValues,
                                [field.name]: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <Input
                            id={field.name}
                            value={currentValue}
                            onChange={(e) =>
                              setEditedFieldValues({
                                ...editedFieldValues,
                                [field.name]: e.target.value,
                              })
                            }
                          />
                        )
                      ) : (
                        <p className="text-sm rounded-md border bg-muted/40 px-3 py-2 whitespace-pre-wrap">
                          {currentValue || (
                            <span className="text-muted-foreground italic">
                              (empty)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* Edit / propose-revision controls */}
        {contract.status === "pending_signatures" && contract.source_type !== "uploaded" && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pencil className="h-5 w-5" />
                  Need changes before signing?
                </CardTitle>
                <CardDescription>
                  Suggest edits to any field. Your changes will be sent to the
                  agent for approval; neither party's signature counts until the
                  text is final.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="revision-message">
                        Message to the agent (optional)
                      </Label>
                      <Textarea
                        id="revision-message"
                        rows={3}
                        placeholder="Explain why you'd like these changes…"
                        value={revisionMessage}
                        onChange={(e) => setRevisionMessage(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={handleProposeRevision}
                        disabled={saving}
                        className="gap-2"
                      >
                        {saving && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Send proposed changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditMode(false);
                          setEditedFieldValues({
                            ...contract.field_values,
                          });
                          setRevisionMessage("");
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(true)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Suggest changes
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

        {/* Signature card */}
        {contract.status === "pending_signatures" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your signature
              </CardTitle>
              <CardDescription>
                {hasSigned
                  ? "You've already signed this contract."
                  : "By signing below, you agree to the terms above."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasSigned ? (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">
                    Signed on{" "}
                    {new Date(
                      userRole === "traveler"
                        ? contract.traveler_signed_at!
                        : contract.agent_signed_at!,
                    ).toLocaleString()}
                  </span>
                </div>
              ) : signatureMode ? (
                <div className="space-y-3">
                  <div className="border-2 border-dashed rounded-lg p-4">
                    <SignaturePad
                      ref={(ref: any) => setSignaturePadRef(ref)}
                      canvasProps={{
                        className: "w-full h-32 bg-muted rounded",
                      }}
                      onEnd={() => {
                        if (signaturePadRef) {
                          setSignature(signaturePadRef.toDataURL());
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={handleSign}
                      disabled={saving || !signature}
                      className="gap-2"
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Submit signature
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (signaturePadRef) signaturePadRef.clear();
                        setSignature("");
                      }}
                      disabled={saving}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSignatureMode(false);
                        setSignature("");
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setSignatureMode(true)}
                  disabled={pendingRevisions.length > 0}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Sign contract
                </Button>
              )}
              {pendingRevisions.length > 0 && !hasSigned && (
                <p className="text-sm text-amber-700">
                  Resolve the pending revisions above before signing.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Separator className="my-8" />
        <p className="text-xs text-muted-foreground text-center">
          Contract ID: {contract.id}
        </p>
      </div>

      {/* Reject revision dialog */}
      <AlertDialog
        open={!!revisionToReject}
        onOpenChange={(open) => !open && setRevisionToReject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject proposed changes?</AlertDialogTitle>
            <AlertDialogDescription>
              The other party will be notified that you rejected their proposed
              changes. The contract will keep its current text. Optionally leave
              a message explaining why.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Optional message (e.g. 'I'd prefer to keep the original cancellation terms')"
            rows={3}
            value={rejectMessage}
            onChange={(e) => setRejectMessage(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setRevisionToReject(null);
                setRejectMessage("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectRevision} disabled={saving}>
              Reject changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
