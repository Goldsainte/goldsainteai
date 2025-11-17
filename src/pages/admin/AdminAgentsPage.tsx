// src/pages/admin/AdminAgentsPage.tsx
import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

type VerificationStatus = "pending" | "verified" | "rejected";

type AgentApplication = {
  id: string;
  agent_id: string;
  agency_name: string | null;
  license_number: string | null;
  license_authority: string | null;
  website: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  years_experience: number | null;
  specialties: string[] | null;
  notes: string | null;
  verification_status: VerificationStatus;
  kyc_provider: string | null;
  kyc_session_id: string | null;
  created_at: string;
  rejection_reason: string | null;
  admin_notes: string | null;
  profiles: {
    full_name: string | null;
    agent_verification_status: VerificationStatus | "none" | null;
  } | null;
};

type Filter = "all" | "pending" | "verified" | "rejected";

export default function AdminAgentsPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [overrideStatus, setOverrideStatus] =
    useState<VerificationStatus | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");

  const navigate = useNavigate();

  // Admin guard: only allow profiles with account_type='admin'
  useEffect(() => {
    let cancelled = false;

    async function guardAndLoad() {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth?redirect=/admin/agents");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error loading admin profile", profileError);
        setError("Could not load your profile.");
        setLoading(false);
        return;
      }

      if (!profile || profile.account_type !== "admin") {
        setError("You do not have access to this page.");
        setLoading(false);
        return;
      }

      await loadApplications();
      if (!cancelled) {
        setLoading(false);
      }
    }

    async function loadApplications() {
      const { data, error: appsError } = await supabase
        .from("agent_applications")
        .select(
          `
          id,
          agent_id,
          agency_name,
          license_number,
          license_authority,
          website,
          instagram_handle,
          tiktok_handle,
          years_experience,
          specialties,
          notes,
          verification_status,
          kyc_provider,
          kyc_session_id,
          created_at,
          rejection_reason,
          admin_notes,
          profiles!agent_id (
            full_name,
            agent_verification_status
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (appsError) {
        console.error("Error loading applications", appsError);
        setError("Could not load agent applications.");
        return;
      }

      setApplications((data || []) as AgentApplication[]);
      if (data && data.length > 0) {
        setSelectedId(data[0].id);
      }
    }

    guardAndLoad();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const selected = applications.find((a) => a.id === selectedId) || null;

  useEffect(() => {
    if (!selected) return;
    setOverrideStatus(selected.verification_status);
    setOverrideReason(selected.rejection_reason || "");
    setOverrideNotes(selected.admin_notes || "");
  }, [selected]);

  const filteredApps = applications.filter((app) => {
    if (filter === "all") return true;
    return app.verification_status === filter;
  });

  async function handleOverrideSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected || !overrideStatus) return;

    setSaving(true);
    setError(null);

    try {
      // 1) Update agent_applications
      const { error: appError } = await supabase
        .from("agent_applications")
        .update({
          verification_status: overrideStatus,
          rejection_reason: overrideStatus === "rejected" ? overrideReason || null : null,
          admin_notes: overrideNotes || null,
        })
        .eq("id", selected.id);

      if (appError) throw appError;

      // 2) Update profiles.agent_verification_status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          agent_verification_status: overrideStatus,
        })
        .eq("id", selected.agent_id);

      if (profileError) throw profileError;

      // 3) Update local state
      setApplications((prev) =>
        prev.map((a) =>
          a.id === selected.id
            ? {
                ...a,
                verification_status: overrideStatus,
                rejection_reason:
                  overrideStatus === "rejected" ? overrideReason || null : null,
                admin_notes: overrideNotes || null,
                profiles: a.profiles
                  ? {
                      ...a.profiles,
                      agent_verification_status: overrideStatus,
                    }
                  : {
                      full_name: null,
                      agent_verification_status: overrideStatus,
                    },
              }
            : a,
        ),
      );
    } catch (err: any) {
      console.error("Error overriding verification", err);
      setError("Could not update verification status.");
    } finally {
      setSaving(false);
    }
  }

  function renderStatusBadge(status: VerificationStatus) {
    if (status === "verified") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#e0f2ef] text-[#0c4d47] px-2 py-0.5 text-[9px]">
          <CheckCircle2 className="h-3 w-3" />
          Verified
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1f0] text-[#b42318] px-2 py-0.5 text-[9px]">
          <AlertTriangle className="h-3 w-3" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff7e6] text-[#b45f06] px-2 py-0.5 text-[9px]">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-4 md:pt-16 md:pb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1 text-[10px] text-[#8D8D8D]"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to home
          </button>
          <div className="inline-flex items-center gap-2 text-[10px] text-[#8D8D8D]">
            <ShieldCheck className="h-3 w-3" />
            Admin · Agent verification
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
              Goldsainte admin
            </p>
            <h1 className="font-display text-[22px] md:text-[24px] leading-tight">
              Agent applications & verification
            </h1>
            <p className="text-[11px] text-[#4a4a4a] max-w-xl">
              Review new agents, see their Stripe Identity status and licenses, and
              manually approve, reject or reset verification when needed.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-[#E5DFC6] px-2 py-1 text-[10px]">
            <span
              className={`px-2 py-0.5 rounded-full cursor-pointer ${
                filter === "pending"
                  ? "bg-[#0c4d47] text-[#E5DFC6]"
                  : "text-[#4a4a4a]"
              }`}
              onClick={() => setFilter("pending")}
            >
              Pending
            </span>
            <span
              className={`px-2 py-0.5 rounded-full cursor-pointer ${
                filter === "verified"
                  ? "bg-[#0c4d47] text-[#E5DFC6]"
                  : "text-[#4a4a4a]"
              }`}
              onClick={() => setFilter("verified")}
            >
              Verified
            </span>
            <span
              className={`px-2 py-0.5 rounded-full cursor-pointer ${
                filter === "rejected"
                  ? "bg-[#0c4d47] text-[#E5DFC6]"
                  : "text-[#4a4a4a]"
              }`}
              onClick={() => setFilter("rejected")}
            >
              Rejected
            </span>
            <span
              className={`px-2 py-0.5 rounded-full cursor-pointer ${
                filter === "all"
                  ? "bg-[#0c4d47] text-[#E5DFC6]"
                  : "text-[#4a4a4a]"
              }`}
              onClick={() => setFilter("all")}
            >
              All
            </span>
          </div>
        </div>

        {loading ? (
          <p className="text-[11px] text-[#8D8D8D]">Loading applications…</p>
        ) : error ? (
          <p className="text-[11px] text-red-600">{error}</p>
        ) : (
          <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 pb-10">
            {/* List */}
            <div className="rounded-3xl bg-white/90 border border-[#E5DFC6] p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D] mb-2">
                Applications
              </p>

              {filteredApps.length === 0 ? (
                <p className="text-[11px] text-[#8D8D8D]">
                  No applications for this filter.
                </p>
              ) : (
                <ul className="space-y-1.5 max-h-[520px] overflow-auto pr-1">
                  {filteredApps.map((app) => {
                    const isSelected = app.id === selectedId;
                    const name =
                      app.profiles?.full_name || app.agency_name || "(no name)";
                    const createdAt = new Date(app.created_at);
                    const dateLabel = createdAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <li key={app.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(app.id)}
                          className={`w-full text-left rounded-2xl border px-3 py-2 text-[11px] ${
                            isSelected
                              ? "bg-[#0c4d47] border-[#0c4d47] text-[#E5DFC6]"
                              : "bg-[#f7f3ea] border-transparent text-[#0a2225]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold truncate">
                              {name}
                            </span>
                            <span className="text-[9px]">
                              {dateLabel}
                            </span>
                          </div>
                          <p
                            className={`text-[10px] truncate mb-1 ${
                              isSelected ? "text-[#E5DFC6]" : "text-[#4a4a4a]"
                            }`}
                          >
                            {app.agency_name || "(no agency name)"} ·{" "}
                            {app.license_authority || "no authority"}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            {renderStatusBadge(app.verification_status)}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Detail */}
            <div className="rounded-3xl bg-white/90 border border-[#E5DFC6] p-3 md:p-4 text-[11px]">
              {!selected ? (
                <p className="text-[11px] text-[#8D8D8D]">
                  Select an application to review.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                        Agent details
                      </p>
                      <h2 className="font-display text-[16px] leading-tight">
                        {selected.profiles?.full_name || selected.agency_name || "(no name)"}
                      </h2>
                    </div>
                    <div className="text-right space-y-1">
                      {renderStatusBadge(selected.verification_status)}
                      <p className="text-[9px] text-[#8D8D8D]">
                        Profile status:{" "}
                        <span className="font-semibold">
                          {selected.profiles?.agent_verification_status ||
                            "none"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[#E5DFC6] my-2" />

                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D] mb-1">
                        Agency
                      </p>
                      <p className="text-[11px] font-semibold">
                        {selected.agency_name || "(not provided)"}
                      </p>
                      <p className="text-[10px] text-[#4a4a4a]">
                        License: {selected.license_number || "–"}
                      </p>
                      <p className="text-[10px] text-[#4a4a4a]">
                        Authority: {selected.license_authority || "–"}
                      </p>
                      <p className="text-[10px] text-[#4a4a4a]">
                        Years of experience:{" "}
                        {selected.years_experience ?? "–"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D] mb-1">
                        Online presence
                      </p>
                      <p className="text-[10px] text-[#4a4a4a]">
                        Website:{" "}
                        {selected.website ? (
                          <a
                            href={selected.website}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2"
                          >
                            {selected.website}
                          </a>
                        ) : (
                          "–"
                        )}
                      </p>
                      <p className="text-[10px] text-[#4a4a4a]">
                        Instagram: {selected.instagram_handle || "–"}
                      </p>
                      <p className="text-[10px] text-[#4a4a4a]">
                        TikTok: {selected.tiktok_handle || "–"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D] mb-1">
                      Specialties
                    </p>
                    {selected.specialties && selected.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selected.specialties.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-[#f7f3ea] border border-[#E5DFC6] px-2 py-0.5 text-[9px] text-[#4a4a4a]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-[#8D8D8D]">None listed.</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D] mb-1">
                      Application notes
                    </p>
                    <p className="text-[10px] text-[#4a4a4a] whitespace-pre-wrap">
                      {selected.notes || "(no additional notes)"}
                    </p>
                  </div>

                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D] mb-1">
                      Stripe Identity
                    </p>
                    <p className="text-[10px] text-[#4a4a4a]">
                      Provider: {selected.kyc_provider || "–"}
                    </p>
                    <p className="text-[10px] text-[#4a4a4a]">
                      Session ID: {selected.kyc_session_id || "–"}
                    </p>
                    <p className="text-[9px] text-[#8D8D8D]">
                      Final status shown above reflects a combination of Stripe
                      Identity results and any manual overrides.
                    </p>
                  </div>

                  <div className="border-t border-[#E5DFC6] my-2" />

                  <form onSubmit={handleOverrideSubmit} className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                      Admin override
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {(["pending", "verified", "rejected"] as VerificationStatus[]).map(
                        (s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setOverrideStatus(s)}
                            className={`rounded-full px-3 py-1 text-[10px] border ${
                              overrideStatus === s
                                ? "bg-[#0c4d47] border-[#0c4d47] text-[#E5DFC6]"
                                : "bg-[#f7f3ea] border-[#E5DFC6] text-[#4a4a4a]"
                            }`}
                          >
                            {s === "pending"
                              ? "Set to pending"
                              : s === "verified"
                              ? "Approve"
                              : "Reject"}
                          </button>
                        ),
                      )}
                    </div>

                    {overrideStatus === "rejected" && (
                      <div>
                        <label className="block text-[10px] mb-1">
                          Rejection reason (visible if we expose this later)
                        </label>
                        <textarea
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          rows={2}
                          className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] focus:outline-none focus:border-[#BFAD72]"
                          placeholder="Missing or invalid license, Identity mismatch, etc."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] mb-1">
                        Internal notes (admin only)
                      </label>
                      <textarea
                        value={overrideNotes}
                        onChange={(e) => setOverrideNotes(e.target.value)}
                        rows={2}
                        className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] focus:outline-none focus:border-[#BFAD72]"
                        placeholder="Short notes about why you approved or rejected this agent."
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={saving || !overrideStatus}
                        className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-4 py-1.5 text-[10px] font-semibold hover:bg-[#073331] disabled:opacity-60"
                      >
                        {saving ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
