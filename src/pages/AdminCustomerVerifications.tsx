import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentViewer } from "@/components/admin/DocumentViewer";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, CheckCircle, XCircle, FileText, User } from "lucide-react";

const REJECTION_REASONS = [
  "Document expired",
  "Photo doesn't match selfie",
  "Document illegible",
  "Name doesn't match profile",
  "Document appears altered",
  "Missing required information",
  "Custom reason"
];

const STATUS_FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" }
];

const STATUS_PILL_CLASSES: Record<string, string> = {
  pending: "border-[#8D6B2F]/40 bg-[#C7A962]/15 text-[#8D6B2F]",
  approved: "border-[#0c4d47]/25 bg-[#0c4d47]/10 text-[#0c4d47]",
  rejected: "border-[#E5DFC6] bg-[#fdfaf2] text-[#0a2225]/45"
};

export default function AdminCustomerVerifications() {
  const queryClient = useQueryClient();
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<{ url: string; type: string } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const [checklist, setChecklist] = useState([
    { id: "name_match", label: "Name on document matches profile", checked: false },
    { id: "photo_match", label: "Photo on document matches selfie", checked: false },
    { id: "valid_date", label: "Document is valid and not expired", checked: false },
    { id: "legible", label: "Document is legible and not altered", checked: false }
  ]);

  // Fetch customer verifications
  const { data: verifications, isLoading, error: loadError } = useQuery({
    queryKey: ['admin-customer-verifications', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('customer_verifications')
        .select(`
          *,
          profiles (
            id,
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    }
  });

  // Best-effort email notification. Honest: approval/rejection already
  // succeeded by the time this runs, so a mail failure is a warning, not
  // a false error — and never a silent swallow.
  const sendVerificationEmail = async (status: 'approved' | 'rejected', reason: string | null) => {
    try {
      const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
        body: {
          user_id: selectedVerification.user_id,
          status,
          rejection_reason: reason
        }
      });
      if (emailError) throw emailError;
    } catch (err: any) {
      toast.warning(`Saved — but the notification email didn't send: ${err?.message ?? 'unknown error'}`);
    }
  };

  // Approve verification mutation
  const approveMutation = useMutation({
    mutationFn: async (verificationId: string) => {
      const currentMetadata = selectedVerification?.metadata || {};
      const { error } = await supabase
        .from('customer_verifications')
        .update({
          status: 'approved',
          metadata: {
            ...currentMetadata,
            admin_notes: adminNotes || null,
            reviewed_at: new Date().toISOString()
          }
        })
        .eq('id', verificationId);

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: selectedVerification.user_id,
        action: 'customer_verification_approved',
        entity_type: 'customer_verification',
        entity_id: verificationId,
        details: { admin_notes: adminNotes, checklist }
      });
    },
    onSuccess: async () => {
      toast.success("Verification approved.");
      await sendVerificationEmail('approved', null);
      queryClient.invalidateQueries({ queryKey: ['admin-customer-verifications'] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to approve verification: ${error?.message ?? 'unknown error'}`);
      console.error(error);
    }
  });

  // Reject verification mutation
  const rejectMutation = useMutation({
    mutationFn: async (verificationId: string) => {
      const currentMetadata = selectedVerification?.metadata || {};
      const { error } = await supabase
        .from('customer_verifications')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          metadata: {
            ...currentMetadata,
            admin_notes: adminNotes || null,
            reviewed_at: new Date().toISOString()
          }
        })
        .eq('id', verificationId);

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: selectedVerification.user_id,
        action: 'customer_verification_rejected',
        entity_type: 'customer_verification',
        entity_id: verificationId,
        details: { admin_notes: adminNotes, rejection_reason: rejectionReason }
      });
    },
    onSuccess: async () => {
      toast.success("Verification rejected.");
      await sendVerificationEmail('rejected', rejectionReason);
      queryClient.invalidateQueries({ queryKey: ['admin-customer-verifications'] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to reject verification: ${error?.message ?? 'unknown error'}`);
      console.error(error);
    }
  });

  const handleChecklistChange = (id: string, checked: boolean) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, checked } : item
    ));
  };

  const handleViewDocument = (url: string, type: string) => {
    setCurrentDocument({ url, type });
    setViewerOpen(true);
  };

  const resetForm = () => {
    setSelectedVerification(null);
    setAdminNotes("");
    setRejectionReason("");
    setChecklist(prev => prev.map(item => ({ ...item, checked: false })));
  };

  const canApprove = checklist.every(item => item.checked);

  return (
    <div className="min-h-screen bg-[#f7f3ea]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">People</p>
          <h1 className="mt-2 font-secondary text-[28px] leading-tight text-[#0a2225] md:text-[30px]">
            Customer verifications
          </h1>
          <p className="mt-2 max-w-xl text-[14px] text-[#0a2225]/55">
            Review traveler identity documents. Approve only when every check on the
            checklist passes; rejections always carry a stated reason.
          </p>
          {loadError && (
            <p className="mt-3 text-sm text-red-700">
              Failed to load verifications: {(loadError as any)?.message ?? 'unknown error'}
            </p>
          )}
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={
                statusFilter === f.value
                  ? "rounded-full border border-[#0c4d47] bg-[#0c4d47] px-4 py-2.5 text-[13px] text-white transition-colors"
                  : "rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-[13px] text-[#6B7280] transition-colors hover:border-[#C7A962] hover:text-[#0a2225]"
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-[#0a2225]/55">Loading verifications…</p>
        ) : (
          <div className="grid gap-6">
            {verifications?.map((verification) => (
              <div
                key={verification.id}
                className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)]"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {(verification as any).profiles?.avatar_url ? (
                      <img
                        src={(verification as any).profiles.avatar_url}
                        alt="User"
                        className="h-12 w-12 rounded-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0c4d47]/10">
                        <User className="h-6 w-6 text-[#0c4d47]" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-secondary text-[17px] text-[#0a2225]">
                        {(verification as any).profiles?.first_name} {(verification as any).profiles?.last_name}
                      </h3>
                      <p className="text-sm text-[#0a2225]/55">@{(verification as any).profiles?.username}</p>
                      <p className="mt-1 text-xs text-[#0a2225]/45">
                        Submitted {new Date(verification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium capitalize ${
                      STATUS_PILL_CLASSES[verification.status] ?? STATUS_PILL_CLASSES.rejected
                    }`}
                  >
                    {verification.status}
                  </span>
                </div>

                <div className="mb-2 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">
                      <FileText className="h-3.5 w-3.5" />
                      Government ID
                    </p>
                    {verification.document_url ? (
                      <button
                        onClick={() => handleViewDocument(verification.document_url, 'Government ID')}
                        className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white px-4 py-2 text-[13px] text-[#6B7280] transition-colors hover:border-[#C7A962] hover:text-[#0a2225]"
                      >
                        <Eye className="h-4 w-4" />
                        View document
                      </button>
                    ) : (
                      <p className="text-sm text-[#0a2225]/45">Not uploaded</p>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">
                      <User className="h-3.5 w-3.5" />
                      Selfie photo
                    </p>
                    {(verification.metadata as any)?.selfie_url ? (
                      <button
                        onClick={() => handleViewDocument((verification.metadata as any).selfie_url, 'Selfie Photo')}
                        className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white px-4 py-2 text-[13px] text-[#6B7280] transition-colors hover:border-[#C7A962] hover:text-[#0a2225]"
                      >
                        <Eye className="h-4 w-4" />
                        View selfie
                      </button>
                    ) : (
                      <p className="text-sm text-[#0a2225]/45">Not uploaded</p>
                    )}
                  </div>
                </div>

                {verification.status === 'pending' && selectedVerification?.id === verification.id && (
                  <div className="mt-6 space-y-5 border-t border-[#F1EBDA] pt-6">
                    <div className="rounded-2xl border border-[#F1EBDA] bg-[#fdfaf2] p-5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">
                        Verification checklist
                      </p>
                      <div className="mt-3 space-y-3">
                        {checklist.map((item) => (
                          <label
                            key={item.id}
                            className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-[#0a2225]/80"
                          >
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={(e) => handleChecklistChange(item.id, e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-[#E5DFC6] accent-[#0c4d47]"
                            />
                            {item.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">
                        Admin notes (optional)
                      </label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add any notes about this verification..."
                        rows={3}
                        className="rounded-xl border-[#E5DFC6] bg-white focus-visible:ring-[#C7A962]"
                      />
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="flex-1">
                        <button
                          onClick={() => approveMutation.mutate(verification.id)}
                          disabled={!canApprove || approveMutation.isPending}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0c4d47] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {approveMutation.isPending ? "Approving…" : "Approve verification"}
                        </button>
                        {!canApprove && (
                          <p className="mt-2 text-xs text-[#0a2225]/45">
                            Complete all checklist items to approve
                          </p>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <Select value={rejectionReason} onValueChange={setRejectionReason}>
                          <SelectTrigger className="h-10 rounded-full border-[#E5DFC6] bg-white text-sm">
                            <SelectValue placeholder="Select rejection reason..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-[#E5DFC6] bg-white">
                            {REJECTION_REASONS.map((reason) => (
                              <SelectItem key={reason} value={reason}>
                                {reason}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => rejectMutation.mutate(verification.id)}
                          disabled={!rejectionReason || rejectMutation.isPending}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#0a2225]/20 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#0a2225]/60 transition-colors hover:bg-[#f7f3ea] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <XCircle className="h-4 w-4" />
                          {rejectMutation.isPending ? "Rejecting…" : "Reject verification"}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={resetForm}
                      className="w-full text-center text-[13px] text-[#0a2225]/45 transition-colors hover:text-[#0a2225]"
                    >
                      Cancel review
                    </button>
                  </div>
                )}

                {verification.status === 'pending' && selectedVerification?.id !== verification.id && (
                  <button
                    onClick={() => setSelectedVerification(verification)}
                    className="mt-4 rounded-full border border-[#C7A962]/50 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8D6B2F] transition-colors hover:bg-[#C7A962]/10"
                  >
                    Start review
                  </button>
                )}

                {verification.status !== 'pending' && (verification.metadata as any)?.admin_notes && (
                  <div className="mt-4 rounded-xl border border-[#F1EBDA] bg-[#fdfaf2] p-4">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">Admin notes</p>
                    <p className="mt-1 text-sm text-[#0a2225]/70">{(verification.metadata as any).admin_notes}</p>
                    {verification.rejection_reason && (
                      <p className="mt-2 text-sm text-[#8D6B2F]">
                        Reason: {verification.rejection_reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {verifications?.length === 0 && (
              <div className="rounded-2xl bg-white p-12 text-center shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
                <p className="text-sm text-[#0a2225]/55">
                  No {statusFilter !== 'all' ? statusFilter : ''} verifications found
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {currentDocument && (
        <DocumentViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          documentUrl={currentDocument.url}
          documentType={currentDocument.type}
          title={currentDocument.type}
        />
      )}
    </div>
  );
}
