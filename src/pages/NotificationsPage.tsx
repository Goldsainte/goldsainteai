import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/BackButton";
import { formatDistanceToNow } from "date-fns";
import {
  fetchNotifications,
  markNotificationRead,
  type Notification,
} from "@/services/notificationService";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await fetchNotifications();
        if (!cancelled) setNotifications(rows);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load notifications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleClick = async (n: Notification) => {
    try {
      if (!n.is_read) {
        await markNotificationRead(n.id);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
      }
      if (n.link) navigate(n.link);
    } catch {
      // ignore
    }
  };

  return (
    <main className="flex-1 bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-6xl px-4 md:px-6 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="mb-6">
          <BackButton />
        </div>
        <p className="text-xs tracking-[0.2em] uppercase text-[#C7A962] font-medium mb-2">
          Notifications
        </p>
        <h1 className="font-secondary text-2xl md:text-3xl leading-tight mb-3">
          What's happening in your Goldsainte world
        </h1>
        <p className="text-base md:text-lg text-[#6B7280] max-w-2xl">
          New trip invites, proposal updates and booking changes appear here — so you can stay on top of opportunities without leaving the platform.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 md:pb-20">
        <div className="rounded-2xl bg-white/95 border border-[#E5DFC6] p-6 md:p-8">
          {loading && (
            <p className="text-sm text-[#6B7280] py-8 text-center">Loading…</p>
          )}
          {error && (
            <p className="text-sm text-red-600 py-4">{error}</p>
          )}
          {!loading && !error && notifications.length === 0 && (
            <div className="text-center py-16">
              <h2 className="font-secondary text-xl md:text-2xl mb-2">Nothing new yet</h2>
              <p className="text-sm md:text-base text-[#6B7280] max-w-md mx-auto">
                As travelers post briefs and respond to your proposals, updates will appear here.
              </p>
            </div>
          )}

          {!loading && !error && notifications.length > 0 && (
            <ul className="divide-y divide-[#E5DFC6]">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 md:px-6 py-4 md:py-5 rounded-xl transition-colors hover:bg-[#f7f3ea]/60 flex items-start justify-between gap-3 ${
                      !n.is_read ? "border-l-2 border-[#C7A962]" : ""
                    }`}
                  >
                    <div className="space-y-1.5">
                      <p className="text-sm md:text-base font-medium">{n.title}</p>
                      {n.message && (
                        <p className="text-sm text-[#6B7280]">{n.message}</p>
                      )}
                      <p className="text-xs text-[#9CA3AF]">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="mt-1.5 inline-flex h-2 w-2 rounded-full bg-[#C7A962] flex-shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
