// src/components/chat/BookingConversation.tsx
//
// Booking-page messaging, backed by the SAME direct-message system as the DM
// inbox — so a message sent here lands in the unified inbox (no more separate
// booking_messages silo). It figures out the "other party" from the booking's
// traveler_id / partner_id, loads that DM thread, and sends through the
// send-direct-message edge function (which finds-or-creates the conversation).
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ChatSafetyBanner } from "./ChatSafetyBanner";
import { SendHorizontal } from "lucide-react";

type DMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function BookingConversation({
  bookingId,
  travelerId,
  partnerId,
}: {
  bookingId: string;
  travelerId?: string | null;
  partnerId?: string | null;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // The other party in this booking: if I'm the traveler, it's the partner;
  // if I'm the partner (agent/creator), it's the traveler.
  const recipientId =
    user && travelerId && partnerId
      ? user.id === travelerId
        ? partnerId
        : travelerId
      : null;

  const loadThread = useCallback(async () => {
    if (!user || !recipientId) {
      setLoading(false);
      return;
    }
    try {
      const [p1, p2] = [user.id, recipientId].sort();
      // Booking-scoped thread (dm_conversations.booking_id, migration 205):
      // this page only ever loads THE thread for this booking. The pair's
      // general/inquiry history stays in the inbox — no more cross-booking
      // leakage. Cast: booking_id postdates the generated types.
      const { data: convo } = await (supabase as any)
        .from("dm_conversations")
        .select("id")
        .eq("participant_1", p1)
        .eq("participant_2", p2)
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (convo?.id) {
        setConversationId(convo.id);
        const { data: msgs } = await supabase
          .from("direct_messages")
          .select("id, conversation_id, sender_id, body, created_at")
          .eq("conversation_id", convo.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: true });
        setMessages((msgs as DMessage[]) || []);
      } else {
        setConversationId(null);
        setMessages([]);
      }
    } catch {
      // Non-fatal: show empty thread, let the person start it.
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [user, recipientId, bookingId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  // Realtime: refresh when a new message hits this conversation.
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`booking-dm-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as DMessage]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  async function handleSend() {
    if (!newMessage.trim() || sending || !recipientId) return;
    setSending(true);
    const text = newMessage.trim();
    try {
      const { error } = await supabase.functions.invoke("send-direct-message", {
        body: {
          recipientId,
          message: text,
          conversationId: conversationId ?? undefined,
          // Scopes the thread to this booking (v2.0 edge fn verifies
          // membership and derives the recipient + label server-side).
          bookingId,
        },
      });
      if (error) throw error;
      setNewMessage("");
      // Reload to pick up the (possibly newly created) conversation + message.
      await loadThread();
    } catch (e) {
      // Surface nothing destructive inline; leave the text so it isn't lost.
      console.error("Booking message send failed", e);
    } finally {
      setSending(false);
    }
  }

  const hasMessages = !loading && messages.length > 0;

  // If we can't resolve the other party, this booking has no partner yet
  // (e.g. platform-owned). Show a gentle note rather than a broken box.
  if (user && travelerId && partnerId && !recipientId) {
    return (
      <p className="text-[15px] italic text-[#0a2225]/50">
        Messaging opens once a specialist is assigned to this booking.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {hasMessages && (
        <div className="max-h-[420px] overflow-y-auto space-y-3 mb-4 pr-1">
          {messages.map((msg) => {
            const isSelf = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`rounded-[18px] px-3.5 py-2 max-w-[85%] ${
                  isSelf
                    ? "bg-[#E8DCC8] ml-auto"
                    : "bg-white border border-[#E5DFC6]"
                }`}
              >
                <p className="text-[12px] uppercase tracking-[0.18em] text-[#0a2225]/45 mb-1">
                  {isSelf ? "You" : "Your travel professional"} ·{" "}
                  {new Date(msg.created_at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <p
                  className="text-[#0a2225] whitespace-pre-line"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    fontSize: "15px",
                    lineHeight: "1.35",
                  }}
                >
                  {msg.body}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !hasMessages && (
        <p className="text-[15px] italic text-[#0a2225]/50 mb-4">
          No messages yet for this booking — start the conversation. It'll appear in your inbox too.
        </p>
      )}

      {loading && <p className="text-[12.5px] text-[#0a2225]/40 mb-4">Loading…</p>}

      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-[15px] focus:outline-none focus:border-[#0c4d47] focus:ring-1 focus:ring-[#0c4d47]/20"
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

      <ChatSafetyBanner />
    </div>
  );
}
