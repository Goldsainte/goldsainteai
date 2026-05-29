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

    // Set up realtime subscription
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
        `
        id,
        content,
        sender_id,
        created_at,
        profiles:sender_id (display_name)
      `
      )
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(
        data.map((m: any) => ({
          id: m.id,
          content: m.content,
          sender_id: m.sender_id,
          sender_name: m.profiles?.display_name || "User",
          created_at: m.created_at,
        }))
      );
    }
    setLoading(false);
  }

  async function handleSend() {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
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

  return (
    <div className="flex flex-col h-[400px]">
      <ChatSafetyBanner />
      
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 mt-2">
        {loading && (
          <p className="text-[10px] text-[#8D8D8D]">Loading messages...</p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-[10px] text-[#8D8D8D]">
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="rounded-2xl bg-[#f7f3ea] p-2">
            <p className="text-[9px] text-[#8D8D8D] mb-0.5">
              {msg.sender_name} · {new Date(msg.created_at).toLocaleTimeString()}
            </p>
            <p className="text-[11px]">{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-[#E5DFC6] px-3 py-2 text-[11px] focus:outline-none focus:border-[#0c4d47]"
          disabled={sending}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#073331] disabled:opacity-50"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}