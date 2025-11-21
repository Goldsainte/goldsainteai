import { useState, useEffect } from "react";

const CONVERSATION_KEY = "madison_conversation_id";

/**
 * Shared conversation ID hook for Madison text & voice chat.
 * Ensures both modalities use the same conversation thread.
 */
export function useMadisonConversation() {
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existing = window.localStorage.getItem(CONVERSATION_KEY);
    if (existing) {
      setConversationId(existing);
    } else {
      const id = crypto.randomUUID();
      window.localStorage.setItem(CONVERSATION_KEY, id);
      setConversationId(id);
    }
  }, []);

  const resetConversation = () => {
    if (typeof window === "undefined") return;
    const id = crypto.randomUUID();
    window.localStorage.setItem(CONVERSATION_KEY, id);
    setConversationId(id);
  };

  return { conversationId, resetConversation };
}
