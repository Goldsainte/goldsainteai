// src/components/chat/BookingConversation.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatSafetyBanner } from "./ChatSafetyBanner";
import { SendHorizontal } from "lucide-react";
 
type Message = {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string | null;
  created_at: string;
};
 
export function BookingConversation({ bookingId }: { bookingId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
 
  useEffect(() => {
    loadMessages();
 
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "booking_messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();
 
    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);
 
  async function loadMessages() {
    const { data, error } = await supabase
      .from("booking_messages")
      .select(
        "id, content, sender_id, sender_name, created_at"
      )
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });
 
    if (!error && data) {
      setMessages(data as Message[]);
    }
    setLoading(false);
  }
 
  async function handleSend() {
    if (!newMessage.trim() || sending) return;
    setSending(true);
 
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSending(false);
      return;
    }
 
    const { error } = await supabase.from("booking_messages").insert({
      booking_id: bookingId,
      sender_id: user.id,
      content: newMessage.trim(),
    });
 
    if (!error) {
      setNewMessage("");
    }
    setSending(false);
  }
 
  const hasMessages = !loading && messages.length > 0;
 
  return (
    <div className="flex flex-col">
      {/* Messages — only render when there are some; otherwise the input is the focus */}
      {hasMessages && (
        <div className="max-h-[420px] overflow-y-auto space-y-3 mb-4 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-2xl bg-white border border-[#E5DFC6] px-4 py-3"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#0a2225]/45 mb-1">
                {msg.sender_name || "Someone"} ·{" "}
                {new Date(msg.created_at).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-[#0a2225] leading-relaxed whitespace-pre-line">
                {msg.content}
              </p>
            </div>
          ))}
        </div>
      )}
 
      {/* Empty state — single quiet line, not a 400px hole */}
      {!loading && !hasMessages && (
        <p className="text-sm italic text-[#0a2225]/50 mb-4">
          No messages yet — start the conversation.
        </p>
      )}
 
      {loading && (
        <p className="text-[11px] text-[#0a2225]/40 mb-4">Loading…</p>
      )}
 
      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#0c4d47] focus:ring-1 focus:ring-[#0c4d47]/20"
          disabled={sending}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#0a2225] disabled:opacity-40 transition-colors"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
 
      {/* Quiet safety footnote */}
      <ChatSafetyBanner />
    </div>
  );
}