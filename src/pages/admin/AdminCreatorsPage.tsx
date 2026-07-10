import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminAccountActions from "@/components/admin/AdminAccountActions";

interface CreatorRow {
  id: string;
  name: string;
  handle: string | null;
  avgRating: number | null;
  ratingCount: number | null;
  totalBookings: number;
  totalEarningsCents: number;
  accountStatus: string | null;
}

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCreators() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, username, account_status")
          .eq("account_type", "creator")
          .order("created_at", { ascending: false });

        if (profileError) throw profileError;

        const ids = data?.map((row) => row.id).filter(Boolean) as string[];
        const bookingStats = new Map<string, { count: number; earnings: number }>();
        if (ids.length) {
          const { data: bookings } = await supabase
            .from("bookings")
            .select("id, creator_id, creator_earnings")
            .in("creator_id", ids);

          (bookings || []).forEach((row) => {
            if (!row.creator_id) return;
            const current = bookingStats.get(row.creator_id) || { count: 0, earnings: 0 };
            bookingStats.set(row.creator_id, {
              count: current.count + 1,
              earnings: current.earnings + ((row.creator_earnings || 0) * 100),
            });
          });
        }

        if (cancelled) return;

        setCreators(
          (data || []).map((row) => {
            const stats = bookingStats.get(row.id) || { count: 0, earnings: 0 };
            return {
              id: row.id,
              name: row.full_name || row.username || "Goldsainte creator",
              handle: row.username || null,
              avgRating: 0,
              ratingCount: 0,
              totalBookings: stats.count,
              totalEarningsCents: stats.earnings,
              accountStatus: row.account_status,
            };
          })
        );
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load creators", err);
          setError(err.message || "Could not load creators");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCreators();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225] px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">People</p>
        <h1 className="mt-2 font-secondary text-[28px] leading-tight md:text-[30px]">Creators</h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#0a2225]/55">
          How creators are performing — bookings influenced, earnings, and activity.
        </p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </section>

      <section className="mx-auto max-w-6xl mt-8">
        {loading ? (
          <p className="text-sm text-[#4a4a4a]">Loading creators…</p>
        ) : creators.length === 0 ? (
          <p className="text-sm text-[#4a4a4a]">No creators found.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
            <table className="min-w-full text-sm">
              <thead>
                 <tr className="text-left text-[12px] text-[#4a4a4a] uppercase tracking-[0.12em]">
                   <th className="px-4 py-3">Creator</th>
                   <th className="px-4 py-3">Status</th>
                   <th className="px-4 py-3">Bookings</th>
                   <th className="px-4 py-3">Earnings</th>
                   <th className="px-4 py-3">Ratings</th>
                   <th className="px-4 py-3 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody>
                {creators.map((creator) => (
                  <tr key={creator.id} className="border-t border-[#F1EBDA]">
                    <td className="px-4 py-4">
                       <p className="font-semibold">{creator.name}</p>
                       <p className="text-[12px] text-[#4a4a4a]">{creator.handle ? `@${creator.handle}` : "No handle"}</p>
                     </td>
                     <td className="px-4 py-4">
                       <AccountStatusBadge status={creator.accountStatus} />
                     </td>
                     <td className="px-4 py-4">
                       <p className="font-semibold">{creator.totalBookings}</p>
                      <p className="text-[12px] text-[#4a4a4a]">Bookings they influenced</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
                          (creator.totalEarningsCents || 0) / 100
                        )}
                      </p>
                      <p className="text-[12px] text-[#4a4a4a]">Goldsainte payouts</p>
                    </td>
                    <td className="px-4 py-4">
                      {creator.avgRating ? (
                        <p className="font-semibold">
                          {creator.avgRating.toFixed(1)} <span className="text-[12px] text-[#4a4a4a]">({creator.ratingCount || 0})</span>
                        </p>
                      ) : (
                        <p className="text-[12px] text-[#4a4a4a]">No reviews yet</p>
                      )}
                     </td>
                     <td className="px-4 py-4 text-right">
                       <AdminAccountActions
                         userId={creator.id}
                         userName={creator.name}
                         currentStatus={creator.accountStatus}
                         onStatusChange={(id, newStatus) =>
                           setCreators((prev) => prev.map((c) => (c.id === id ? { ...c, accountStatus: newStatus } : c)))
                         }
                         onDeleted={(id) => setCreators((prev) => prev.filter((c) => c.id !== id))}
                       />
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
       </section>
     </main>
   );
 }

function AccountStatusBadge({ status }: { status: string | null }) {
  const s = status?.toLowerCase() || "active";
  const styles: Record<string, string> = {
    active: "border-[#0c4d47]/25 bg-[#0c4d47]/10 text-[#0c4d47]",
    suspended: "border-[#8D6B2F]/40 bg-[#C7A962]/15 text-[#8D6B2F]",
    banned: "border-[#0a2225]/20 bg-[#0a2225]/5 text-[#0a2225]/60",
  };
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[11.5px] font-medium ${styles[s] || styles.active}`}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}
