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

  // Stored notification links may be absolute URLs (e.g.
  // "https://goldsainte.ai/contract/<id>/sign"). react-router treats absolute
  // URLs as relative segments and mangles them into /notifications/https:/...
  // — so same-origin links are converted to their path before navigating, and
  // genuinely external links leave via the browser instead of the router.
  const openNotificationLink = (raw: string) => {
    try {
      if (/^https?:\/\//i.test(raw)) {
        const url = new URL(raw);
        if (url.origin === window.location.origin) {
          navigate(url.pathname + url.search + url.hash);
        } else {
          window.location.assign(raw);
        }
        return;
      }
      navigate(raw.startsWith("/") ? raw : `/${raw}`);
    } catch {
      /* malformed link — stay put rather than 404 */
    }
  };

  const handleClick = async (n: Notification) => {
    try {
      if (!n.is_read) {
        await markNotificationRead(n.id);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
      }
      if (n.link) openNotificationLink(n.link);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex-1 bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-6xl px-4 md:px-6 pt-8 pb-6 md:pt-10 md:pb-8">
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
        <div className="rounded-2xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5">
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
                    className={`w-full text-left px-4 md:px-5 py-2.5 md:py-3 rounded-xl transition-colors hover:bg-[#f7f3ea]/60 flex items-center justify-between gap-3 ${
                      !n.is_read ? "border-l-2 border-[#C7A962]" : ""
                    }`}
                  >
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{n.title}</span>
                      {n.message && (
                        <span className="text-[#6B7280]"> {n.message}</span>
                      )}
                      <span className="text-[#9CA3AF] ml-1.5">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </p>
                    {!n.is_read && (
                      <span className="inline-flex h-2 w-2 rounded-full bg-[#C7A962] flex-shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
