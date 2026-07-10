import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Search, ShieldCheck, ShieldOff } from "lucide-react";

type Role = "admin" | "agent" | "brand" | "moderator" | "user";
type AccountType = "traveler" | "creator" | "agent" | "brand";

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  username: string | null;
  account_type: AccountType | null;
  account_status: string | null;
  kyc_status: string | null;
  is_profile_complete: boolean | null;
  onboarding_completed: boolean | null;
  created_at: string | null;
  roles: Role[];
};

const ACCOUNT_TYPES: AccountType[] = ["traveler", "creator", "agent", "brand"];

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<"" | AccountType>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    const [{ data: profiles, error }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, email, full_name, display_name, username, account_type, account_status, kyc_status, is_profile_complete, onboarding_completed, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    if (error) {
      toast({ title: "Failed to load users", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const rolesByUser = new Map<string, Role[]>();
    (roles || []).forEach((r: any) => {
      const list = rolesByUser.get(r.user_id) || [];
      list.push(r.role as Role);
      rolesByUser.set(r.user_id, list);
    });

    setUsers(
      (profiles || []).map((p: any) => ({
        ...p,
        roles: rolesByUser.get(p.id) || [],
      })) as UserRow[]
    );
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (accountFilter && u.account_type !== accountFilter) return false;
      if (!q) return true;
      return (
        (u.email || "").toLowerCase().includes(q) ||
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.display_name || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    });
  }, [users, search, accountFilter]);

  async function callRoleFn(targetUserId: string, payload: {
    accountType?: AccountType;
    addRoles?: Role[];
    removeRoles?: Role[];
  }) {
    setUpdatingId(targetUserId);
    try {
      const { error } = await supabase.functions.invoke("admin-set-user-role", {
        body: { targetUserId, ...payload },
      });
      if (error) throw error;
      toast({ title: "Updated", description: "User access updated." });
      await loadUsers();
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  }

  function changeAccountType(user: UserRow, newType: AccountType) {
    if (user.account_type === newType) return;
    // Sync user_roles for agent/brand to mirror account type. Travelers/creators have no auto role.
    const addRoles: Role[] = [];
    const removeRoles: Role[] = [];
    if (newType === "agent") addRoles.push("agent");
    if (newType === "brand") addRoles.push("brand");
    if (user.account_type === "agent" && newType !== "agent") removeRoles.push("agent");
    if (user.account_type === "brand" && newType !== "brand") removeRoles.push("brand");
    callRoleFn(user.id, { accountType: newType, addRoles, removeRoles });
  }

  function toggleAdmin(user: UserRow) {
    const isAdmin = user.roles.includes("admin");
    if (isAdmin) {
      if (!confirm(`Remove admin access from ${user.email || user.full_name}?`)) return;
      callRoleFn(user.id, { removeRoles: ["admin"] });
    } else {
      if (!confirm(`Grant admin access to ${user.email || user.full_name}? They will have full platform access.`)) return;
      callRoleFn(user.id, { addRoles: ["admin"] });
    }
  }

  function exportCsv() {
    const headers = [
      "id",
      "email",
      "full_name",
      "display_name",
      "username",
      "account_type",
      "roles",
      "account_status",
      "kyc_status",
      "is_profile_complete",
      "onboarding_completed",
      "created_at",
    ];
    const escape = (v: any) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filtered.map((u) =>
      [
        u.id,
        u.email,
        u.full_name,
        u.display_name,
        u.username,
        u.account_type,
        u.roles.join("|"),
        u.account_status,
        u.kyc_status,
        u.is_profile_complete,
        u.onboarding_completed,
        u.created_at,
      ]
        .map(escape)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goldsainte-users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const stats = useMemo(() => {
    return {
      total: users.length,
      travelers: users.filter((u) => u.account_type === "traveler").length,
      creators: users.filter((u) => u.account_type === "creator").length,
      agents: users.filter((u) => u.account_type === "agent").length,
      brands: users.filter((u) => u.account_type === "brand").length,
      admins: users.filter((u) => u.roles.includes("admin")).length,
    };
  }, [users]);

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225] px-6 py-10">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">People</p>
            <h1 className="mt-2 font-secondary text-[28px] leading-tight md:text-[30px]">Users</h1>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#0a2225]/55">
              Manage access, change account types, and export the user list.
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
          >
            <Download className="h-4 w-4" /> Export CSV ({filtered.length})
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Total", value: stats.total },
            { label: "Travelers", value: stats.travelers },
            { label: "Creators", value: stats.creators },
            { label: "Agents", value: stats.agents },
            { label: "Brands", value: stats.brands },
            { label: "Admins", value: stats.admins },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-4 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#8D6B2F]">{s.label}</p>
              <p className="mt-1 font-secondary text-[22px]">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a4a4a]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email, name, username, or ID…"
              className="w-full rounded-full border border-[#E5DFC6] bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
            />
          </div>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value as any)}
            className="rounded-full border border-[#E5DFC6] bg-white px-4 py-2 text-sm"
          >
            <option value="">All account types</option>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#fdfaf2] text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Account type</th>
                  <th className="px-4 py-3 text-left">Roles</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#4a4a4a]">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#4a4a4a]">No users found.</td></tr>
                ) : (
                  filtered.map((u) => {
                    const isAdmin = u.roles.includes("admin");
                    const busy = updatingId === u.id;
                    return (
                      <tr key={u.id} className="border-t border-[#E5DFC6]/60 hover:bg-[#F7F3EA]/40">
                        <td className="px-4 py-3">
                          <div className="font-medium">{u.full_name || u.display_name || u.username || "—"}</div>
                          <div className="text-[12px] text-[#4a4a4a]">{u.email || u.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.account_type || ""}
                            disabled={busy}
                            onChange={(e) => changeAccountType(u, e.target.value as AccountType)}
                            className="rounded-full border border-[#E5DFC6] bg-white px-3 py-1 text-xs"
                          >
                            <option value="" disabled>—</option>
                            {ACCOUNT_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length === 0 && <span className="text-[12px] text-[#4a4a4a]">user</span>}
                            {u.roles.map((r) => (
                              <span
                                key={r}
                                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${
                                  r === "admin" ? "bg-[#0c4d47] text-white" : "bg-[#F1EBDA] text-[#0a2225]"
                                }`}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px]">
                          <div>{u.account_status || "active"}</div>
                          {u.kyc_status && <div className="text-[#4a4a4a]">KYC: {u.kyc_status}</div>}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[#4a4a4a]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => toggleAdmin(u)}
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-colors ${
                              isAdmin
                                ? "border border-[#0a2225]/20 text-[#0a2225]/60 hover:bg-[#f7f3ea]"
                                : "bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#0a2225]"
                            }`}
                          >
                            {isAdmin ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                            {isAdmin ? "Revoke admin" : "Make admin"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
