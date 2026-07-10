// src/pages/admin/AdminTrustSafety.tsx
// Reskinned Jul 10 into the Registry house style (Registry phase two).
// All queries, handlers, and gating logic preserved from the original;
// the per-page BackButton is gone — the RegistryBar carries navigation now.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  report_type: string;
  report_category: string;
  description: string;
  status: string;
  severity: string;
  created_at: string;
  admin_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
}

const STATUS_PILL: Record<string, string> = {
  pending: "border-[#8D6B2F]/40 bg-[#C7A962]/15 text-[#8D6B2F]",
  under_review: "border-[#E5DFC6] bg-[#E5DFC6]/40 text-[#0a2225]/70",
  resolved: "border-[#0c4d47]/25 bg-[#0c4d47]/10 text-[#0c4d47]",
  dismissed: "border-[#E5DFC6] bg-[#fdfaf2] text-[#0a2225]/45",
};

export default function AdminTrustSafety() {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    loadReports();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      toast.error("Admin access required");
      navigate("/");
    }
  };

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from("user_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error("Error loading reports:", error);
      toast.error(`Failed to load reports: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_reports")
        .update({
          status: newStatus,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          admin_notes: resolutionNotes || null,
        })
        .eq("id", reportId);

      if (error) throw error;

      toast.success("Report updated successfully");
      setSelectedReport(null);
      setResolutionNotes("");
      loadReports();
    } catch (error: any) {
      console.error("Error updating report:", error);
      toast.error(`Failed to update report: ${error.message}`);
    }
  };

  const pill = (label: string, key: string) => (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10.5px] ${STATUS_PILL[key] || STATUS_PILL.pending}`}
    >
      {label}
    </span>
  );

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-5 py-10 text-[#0a2225] md:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">
          Trust &amp; systems
        </p>
        <h1 className="mt-2 font-secondary text-[28px] leading-tight md:text-[30px]">
          Trust &amp; safety
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#0a2225]/55">
          Review and resolve user reports.
        </p>

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)]"
                >
                  <div className="h-5 w-1/3 rounded bg-[#f7f3ea]" />
                  <div className="mt-4 h-16 rounded bg-[#f7f3ea]" />
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
              <p className="font-secondary text-[15px] italic text-[#C7A962]">i.</p>
              <p className="mt-2 text-[14px] text-[#0a2225]/55">
                No reports to review — the house is quiet.
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-secondary text-[18px] capitalize">
                      {report.report_type.replace("_", " ")} — {report.report_category.replace("_", " ")}
                    </h2>
                    <p className="mt-1.5 text-[12px] text-[#0a2225]/50">
                      Severity:{" "}
                      <span className="rounded-full border border-[#E5DFC6] px-2 py-0.5 text-[10.5px] text-[#0a2225]/70">
                        {report.severity}
                      </span>
                      <span className="ml-3">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                  {pill(report.status.replace("_", " "), report.status)}
                </div>

                <p className="mt-4 text-[13.5px] leading-relaxed text-[#0a2225]/75">
                  {report.description}
                </p>

                {report.admin_notes && (
                  <div className="mt-4 rounded-xl border border-[#E5DFC6] bg-[#fdfaf2] p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#8D6B2F]">
                      Admin notes
                    </p>
                    <p className="mt-1.5 text-[13px] text-[#0a2225]/75">{report.admin_notes}</p>
                  </div>
                )}

                {report.status === "pending" && (
                  <div className="mt-5 space-y-3 border-t border-[#F1EBDA] pt-5">
                    <Textarea
                      placeholder="Add resolution notes..."
                      value={selectedReport === report.id ? resolutionNotes : ""}
                      onChange={(e) => {
                        setSelectedReport(report.id);
                        setResolutionNotes(e.target.value);
                      }}
                      rows={3}
                      className="rounded-xl border-[#E5DFC6] bg-white text-[13.5px] focus-visible:ring-[#C7A962]"
                    />
                    <div className="flex flex-wrap justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(report.id, "dismissed")}
                        className="rounded-full border border-[#0a2225]/20 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#0a2225]/70 transition-colors hover:bg-[#f7f3ea]"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(report.id, "under_review")}
                        className="rounded-full border border-[#C7A962]/50 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8D6B2F] transition-colors hover:bg-[#C7A962]/10"
                      >
                        Mark under review
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(report.id, "resolved")}
                        className="rounded-full bg-[#0c4d47] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
