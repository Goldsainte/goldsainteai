// Admin console for monitoring bookings, disputes, and marketplace health
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

type AdminBooking = {
  id: string;
  status: string;
  total_amount: number | null;
  currency: string | null;
  created_at: string;
  trips?: { title: string | null; destination: string | null } | null;
};

type AdminDispute = {
  id: string;
  status: string;
  reason: string | null;
  created_at: string;
  booking_id: string;
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAdminAndLoad() {
      if (!user) return;

      setLoading(true);
      
      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (cancelled) return;

      if (!roleData) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // Load bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          total_amount,
          currency,
          created_at,
          trips (title, destination)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!cancelled && !bookingsError) {
        setBookings(bookingsData || []);
      }

      // Load disputes
      const { data: disputesData, error: disputesError } = await supabase
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!cancelled && !disputesError) {
        setDisputes(disputesData || []);
      }

      setLoading(false);
    }

    checkAdminAndLoad();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-2xl bg-card px-5 py-4 text-sm text-destructive shadow-sm ring-1 ring-border">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="border-b border-border pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Admin Console</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor bookings, disputes, and marketplace health
          </p>
        </header>

        {/* Bookings section */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-medium">ID</th>
                  <th className="pb-3 pr-4 font-medium">Trip</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {booking.id.substring(0, 8)}
                      </code>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="max-w-xs truncate">
                        {booking.trips?.title || "Untitled"}
                        {booking.trips?.destination && (
                          <span className="text-muted-foreground"> · {booking.trips.destination}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        booking.status === "paid" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
                        booking.status === "disputed" ? "bg-red-50 text-red-700 ring-1 ring-red-200" :
                        booking.status === "awaiting_payment" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" :
                        "bg-muted text-muted-foreground ring-1 ring-border"
                      ].join(" ")}>
                        {booking.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {booking.total_amount
                        ? `${booking.currency || "USD"} ${booking.total_amount.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No bookings yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Disputes section */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Open Disputes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-medium">ID</th>
                  <th className="pb-3 pr-4 font-medium">Booking</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Reason</th>
                  <th className="pb-3 pr-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {disputes.map((dispute) => (
                  <tr key={dispute.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {dispute.id.substring(0, 8)}
                      </code>
                    </td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {dispute.booking_id.substring(0, 8)}
                      </code>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        dispute.status === "open" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" :
                        dispute.status === "resolved" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
                        dispute.status === "rejected" ? "bg-red-50 text-red-700 ring-1 ring-red-200" :
                        "bg-muted text-muted-foreground ring-1 ring-border"
                      ].join(" ")}>
                        {dispute.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="max-w-md truncate">
                        {dispute.reason || "—"}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(dispute.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {disputes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No disputes opened yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
