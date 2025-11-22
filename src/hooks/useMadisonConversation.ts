import { useState } from "react";

const CONVERSATION_KEY = "madison_conversation_id";

/**
 * Shared conversation ID hook for Madison text & voice chat.
 * Ensures both modalities use the same conversation thread.
 */
export function useMadisonConversation() {
  const [conversationId, setConversationIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;

    const existing = window.localStorage.getItem(CONVERSATION_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    window.localStorage.setItem(CONVERSATION_KEY, id);
    return id;
  });

  const setConversationId = (id: string | null) => {
    if (typeof window === "undefined" || !id) return;
    window.localStorage.setItem(CONVERSATION_KEY, id);
    setConversationIdState(id);
  };

  const resetConversation = () => {
    if (typeof window === "undefined") return;
    const id = crypto.randomUUID();
    window.localStorage.setItem(CONVERSATION_KEY, id);
    setConversationIdState(id);
  };

  return { conversationId, setConversationId, resetConversation };
}
