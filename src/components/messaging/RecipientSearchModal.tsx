import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// IG-replica "New message" sheet in the Goldsainte palette: To: row with a
// selected-recipient chip, live results as you type, Chat button at the
// bottom. Search runs through the SECURITY DEFINER search_messageable_users
// function (profiles is locked to counterparties — by design).

type Recipient = {
  id: string;
  display_name: string;
  full_name?: string | null;
  username: string | null;
  avatar_url: string | null;
  account_type: string | null;
  is_verified?: boolean | null;
};

interface RecipientSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRecipient: (recipient: { id: string; name: string }) => void;
}

const ROLE_LABELS: Record<string, string> = {
  creator: "Creator",
  agent: "Travel Agent",
  traveler: "Traveler",
  brand: "Brand",
};

export function RecipientSearchModal({
  open,
  onOpenChange,
  onSelectRecipient,
}: RecipientSearchModalProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<Recipient | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setResults([]);
      setSelected(null);
      setSearchError(null);
    }
  }, [open]);

  useEffect(() => {
    const searchUsers = async () => {
      const q = search.trim().replace(/^@+/, "").replace(/[%,()]/g, "");
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      setSearchError(null);
      try {
        const { data, error } = await supabase.rpc("search_messageable_users", { q });
        if (error) throw error;
        setResults((data as any) || []);
      } catch (e: any) {
        console.error("Search error:", e);
        setSearchError(e?.message || "Search failed — please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search, user?.id]);

  const startChat = () => {
    if (!selected) return;
    onSelectRecipient({
      id: selected.id,
      name: selected.display_name || selected.full_name || "User",
    });
  };

  const q = search.trim().replace(/^@+/, "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden rounded-2xl border border-[#E5DFC6] bg-[#FDF9F0] p-0">
        {/* Header */}
        <div className="flex h-14 items-center justify-center border-b border-[#E5DFC6]">
          <h2 className="font-secondary text-[18px] font-semibold text-[#0a2225]">
            New message
          </h2>
        </div>

        {/* To: row */}
        <div className="flex min-h-[56px] flex-wrap items-center gap-2 border-b border-[#E5DFC6] px-5 py-2">
          <span className="text-[15px] font-semibold text-[#0a2225]">To:</span>
          {selected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47] py-1 pl-3 pr-1.5 text-[13px] font-medium text-[#f7f3ea]">
              {selected.display_name || selected.full_name || "User"}
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-0.5 hover:bg-white/15"
                aria-label="Remove recipient"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ) : (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or @handle…"
              className="min-w-[140px] flex-1 bg-transparent text-[15px] text-[#0a2225] outline-none placeholder:text-[#0a2225]/40"
            />
          )}
        </div>

        {/* Results */}
        <div className="h-[320px] overflow-y-auto py-2">
          {loading && (
            <div className="flex items-center gap-2 px-5 py-3 text-sm text-[#0a2225]/50">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          )}
          {!loading && searchError && (
            <p className="px-5 py-3 text-sm text-[#993c1d]">{searchError}</p>
          )}
          {!loading && !searchError && q.length < 2 && !selected && (
            <p className="px-5 py-3 text-sm text-[#0a2225]/45">
              Type at least 2 characters to search.
            </p>
          )}
          {!loading && !searchError && q.length >= 2 && results.length === 0 && (
            <p className="px-5 py-3 text-sm text-[#0a2225]/55">
              No account matches — check the spelling of their name or @handle.
            </p>
          )}
          {results.map((r) => {
            const isSelected = selected?.id === r.id;
            const name = r.display_name || r.full_name || "User";
            return (
              <button
                key={r.id}
                onClick={() => setSelected(isSelected ? null : r)}
                className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-white/70"
              >
                {r.avatar_url ? (
                  <img
                    src={r.avatar_url}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0c4d47] font-secondary text-[17px] text-[#E5DFC6]">
                    {name[0]?.toUpperCase() || "G"}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-[#0a2225]">{name}</span>
                  <span className="block truncate text-[13px] text-[#0a2225]/55">
                    {r.username && <span className="text-[#8D6B2F]">@{r.username}</span>}
                    {r.username && r.account_type && " · "}
                    {r.account_type ? ROLE_LABELS[r.account_type] ?? r.account_type : ""}
                  </span>
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isSelected
                      ? "border-[#0c4d47] bg-[#0c4d47]"
                      : "border-[#0a2225]/25"
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#f7f3ea]" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Chat button */}
        <div className="border-t border-[#E5DFC6] p-4">
          <button
            disabled={!selected}
            onClick={startChat}
            className="h-11 w-full rounded-xl bg-[#0c4d47] text-[15px] font-medium text-[#f7f3ea] transition-colors hover:bg-[#0a2225] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Chat
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
