// src/pages/NotificationsPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
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
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = async (n: Notification) => {
    try {
      if (!n.is_read) {
        await markNotificationRead(n.id);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
      }

      if (n.link) {
        navigate(n.link);
      }
    } catch {
      // ignore
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-4xl px-4 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/tiktok-lab"
            className="inline-flex items-center gap-1 text-[10px] text-[#8D8D8D]"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to TikTok Lab
          </Link>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0c4d47]">
            <Sparkles className="h-3 w-3 text-[#E5DFC6]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
              Notifications
            </p>
            <h1 className="font-display text-[20px] leading-tight">
              What's happening in your Goldsainte world
            </h1>
          </div>
        </div>
        <p className="text-[11px] text-[#4a4a4a] max-w-md">
          New trip invites, proposal updates and booking changes appear here —
          so you can stay on top of opportunities without leaving the platform.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 md:pb-20">
        <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 text-[11px] space-y-2">
          {loading && <p className="text-[10px] text-[#8D8D8D]">Loading…</p>}
          {error && (
            <p className="text-[10px] text-red-600">
              {error}
            </p>
          )}
          {!loading && !error && notifications.length === 0 && (
            <p className="text-[10px] text-[#8D8D8D]">
              You don't have any notifications yet. As travelers post briefs
              and respond to your proposals, updates will appear here.
            </p>
          )}

          {!loading && !error && notifications.length > 0 && (
            <ul className="divide-y divide-[#E5DFC6]">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`w-full text-left py-2.5 flex items-start justify-between gap-3 ${
                      !n.is_read ? "bg-[#f7f3ea]" : "bg-transparent"
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold">{n.title}</p>
                      {n.message && (
                        <p className="text-[10px] text-[#4a4a4a]">{n.message}</p>
                      )}
                      <p className="text-[9px] text-[#8D8D8D]">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#0c4d47]" />
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
