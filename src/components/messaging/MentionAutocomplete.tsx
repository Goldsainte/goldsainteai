import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type MentionSuggestion = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  account_type: string | null;
};

interface Props {
  query: string; // text after @, can be ""
  onSelect: (s: MentionSuggestion) => void;
  onClose: () => void;
  excludeUserId?: string | null;
}

/**
 * Floating popover of profiles matching @query.
 * Searches profiles by username or full_name; restricted to creators / agents.
 */
export function MentionAutocomplete({ query, onSelect, onClose, excludeUserId }: Props) {
  const [items, setItems] = useState<MentionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const myReq = ++reqIdRef.current;
    let cancelled = false;
    setLoading(true);

    const run = async () => {
      const q = query.trim();
      let builder = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, account_type")
        .in("account_type", ["creator", "agent", "travel_agent"])
        .limit(6);

      if (q.length > 0) {
        const safe = q.replace(/[%,]/g, "");
        builder = builder.or(
          `username.ilike.${safe}%,full_name.ilike.%${safe}%`
        );
      } else {
        builder = builder.order("followers_count", { ascending: false });
      }

      const { data } = await builder;
      if (cancelled || myReq !== reqIdRef.current) return;

      const filtered = (data || []).filter(
        (p: any) => p.id !== excludeUserId && (p.username || p.full_name)
      ) as MentionSuggestion[];

      setItems(filtered);
      setActiveIdx(0);
      setLoading(false);
    };

    const t = setTimeout(run, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, excludeUserId]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (items.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        onSelect(items[activeIdx]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [items, activeIdx, onSelect, onClose]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 rounded-xl border border-[#E5DFC6] bg-white shadow-lg overflow-hidden z-50">
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#9CA3AF] border-b border-[#E5DFC6]/60 bg-[#FDFBF7]">
        Mention a creator or agent
      </div>
      {loading && items.length === 0 ? (
        <div className="px-3 py-3 text-xs text-[#5a6c6e]">Searching…</div>
      ) : (
        <ul className="max-h-64 overflow-y-auto">
          {items.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(p);
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  i === activeIdx ? "bg-[#F6F0E4]" : "hover:bg-[#FDFBF7]"
                }`}
              >
                <Avatar className="h-8 w-8 border border-[#E5DFC6]">
                  <AvatarImage src={p.avatar_url || undefined} />
                  <AvatarFallback className="bg-[#F6F0E4] text-[#0a2225] text-xs">
                    {(p.full_name || p.username || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[#0a2225] truncate">
                    {p.full_name || p.username}
                  </div>
                  <div className="text-[11px] text-[#5a6c6e] truncate">
                    {p.username ? `@${p.username}` : ""}
                    {p.account_type ? (
                      <span className="ml-1 text-[#C7A962]">
                        · {p.account_type === "travel_agent" ? "Agent" : p.account_type}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}