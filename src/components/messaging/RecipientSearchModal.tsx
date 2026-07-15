import { useState, useEffect } from "react";
import { Search, User, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Recipient {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  account_type: string | null;
  is_verified: boolean | null;
}

interface RecipientSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRecipient: (recipient: { id: string; name: string }) => void;
}

export function RecipientSearchModal({
  open,
  onOpenChange,
  onSelectRecipient,
}: RecipientSearchModalProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const searchUsers = async () => {
      if (search.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      setSearchError(null);
      try {
        const q = search.trim().replace(/^@+/, "").replace(/[%,()]/g, "");
        const { data, error } = await supabase.rpc("search_messageable_users", { q });

        if (error) throw error;
        setResults(data || []);
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

  const handleSelect = (recipient: Recipient) => {
    onSelectRecipient({
      id: recipient.id,
      name: recipient.display_name || (recipient as any).full_name || "User",
    });
    onOpenChange(false);
  };

  const getAccountTypeLabel = (type: string | null) => {
    switch (type) {
      case "creator":
        return "Creator";
      case "agent":
        return "Travel Agent";
      case "traveler":
        return "Traveler";
      default:
        return "Member";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#FDF9F0] rounded-[24px] border border-[#E5DFC6]">
        <DialogHeader>
          <DialogTitle className="font-secondary text-[#0a2225] text-xl">
            New Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9a9c]" />
            <Input
              placeholder="Search by name or username"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 sm:pl-10 bg-white border-[#E5DFC6] focus:border-[#C7A962] rounded-full"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C7A962]" />
              </div>
            )}

            {!loading && search.length >= 2 && results.length === 0 && (
              <div className="text-center py-8">
                <User className="h-10 w-10 mx-auto text-[#C7A962] mb-2" />
                <p className="text-[#5a6c6e] text-sm">No users found</p>
                <p className="text-[#8a9a9c] text-xs mt-1">
                  Try a different search term
                </p>
              </div>
            )}

            {!loading && search.length < 2 && (
              <div className="text-center py-8">
                <Search className="h-10 w-10 mx-auto text-[#C7A962] mb-2" />
                {searchError ? (
                  <p className="text-sm text-[#993c1d]">{searchError}</p>
                ) : (
                <p className="text-[#5a6c6e] text-sm">
                  Search for someone to message
                </p>
                )}
                <p className="text-[#8a9a9c] text-xs mt-1">
                  Type at least 2 characters
                </p>
              </div>
            )}

            {!loading &&
              results.map((recipient) => (
                <button
                  key={recipient.id}
                  onClick={() => handleSelect(recipient)}
                  className="w-full flex items-center gap-3 p-3 bg-white hover:bg-[#F6F0E4] border border-[#E5DFC6] rounded-xl transition-colors text-left"
                >
                  <Avatar className="h-10 w-10 border border-[#E5DFC6]">
                    <AvatarImage src={recipient.avatar_url || undefined} />
                    <AvatarFallback className="bg-[#F6F0E4] text-[#0a2225]">
                      {(recipient.display_name || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[#0a2225] truncate">
                        {recipient.display_name || "User"}
                      </span>
                      {recipient.is_verified && (
                        <CheckCircle2 className="h-4 w-4 text-[#C7A962] flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#8a9a9c]">
                      {recipient.username && (
                        <span className="text-[#C7A962]">@{recipient.username}</span>
                      )}
                      <span>{getAccountTypeLabel(recipient.account_type)}</span>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
