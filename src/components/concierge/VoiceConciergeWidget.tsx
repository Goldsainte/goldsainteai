import { useEffect, useState } from "react";
import { X, Mic, MicOff, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MADISON_NAME, MADISON_VOICE_INTRO } from "@/lib/madisonPersona";
import { VoiceConciergeButton } from "@/components/VoiceConciergeButton";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export function VoiceConciergeWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);

  function startListening() {
    setListening(true);
    // TODO: wire to existing voice engine
  }

  function stopListening() {
    setListening(false);
  }

  function handleClose() {
    setOpen(false);
    setListening(false);
  }

  async function loadOrCreateSession() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRequiresLogin(true);
        setMessages([
          {
            id: "login",
            role: "assistant",
            content: MADISON_VOICE_INTRO.trim(),
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }

      setRequiresLogin(false);

      const { data: existing } = await supabase
        .from("concierge_sessions")
        .select("id")
        .eq("user_id", user.id)
        .order("last_active_at", { ascending: false })
        .limit(1);

      let sid = existing?.[0]?.id;
      if (!sid) {
        const { data: created, error } = await supabase
          .from("concierge_sessions")
          .insert({
            user_id: user.id,
            mode: "voice",
            title: "Chat with Madison",
          })
          .select("id")
          .single();

        if (error) {
          console.error(error);
        } else {
          sid = created.id;
        }
      }

      if (!sid) return;

      setSessionId(sid);

      const { data: msgs } = await supabase
        .from("concierge_messages")
        .select("id, role, content, created_at")
        .eq("session_id", sid)
        .order("created_at", { ascending: true });

      const initialMessages: Message[] = (msgs || []) as any;

      if (!initialMessages.some((m) => m.role === "assistant")) {
        initialMessages.push({
          id: "intro",
          role: "assistant",
          content: MADISON_VOICE_INTRO.trim(),
          created_at: new Date().toISOString(),
        });
      }

      setMessages(initialMessages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (requiresLogin) {
      navigate('/login?redirect=/concierge');
      return;
    }

    if (!sessionId || !input.trim()) return;
    const userMessage = input.trim();
    setInput("");
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        role: "user",
        content: userMessage,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      await supabase.from("concierge_messages").insert({
        session_id: sessionId,
        role: "user",
        content: userMessage,
      });

      // TODO: call AI backend / Codex
      const assistantReply =
        "I've noted that. Would you like me to turn this into a storyboard, match creators and agents, or draft a brief to post to the marketplace?";

      const { data: savedAssistant } = await supabase
        .from("concierge_messages")
        .insert({
          session_id: sessionId,
          role: "assistant",
          content: assistantReply,
        })
        .select("id, role, content, created_at")
        .single();

      if (savedAssistant) {
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== tempId)
            .concat(savedAssistant as Message),
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (open && !sessionId) {
      loadOrCreateSession();
    }
  }, [open, sessionId]);

  return (
    <>
      {/* Floating button */}
      <VoiceConciergeButton onClick={() => setOpen(true)} />

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-40 w-[320px] max-w-[90vw] rounded-[28px] border border-[#E5DFC6] bg-white text-[#0a2225] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#E5DFC6] px-4 py-3">
            <p className="text-sm font-secondary font-medium text-[#0a2225]">{MADISON_NAME}</p>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full bg-[#f7f3ea] p-1.5 hover:bg-[#f0e8d9]"
              aria-label="Close"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="px-4 pb-4 pt-3 text-sm space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 py-6 text-[#8D8D8D]">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading Madison…
              </div>
            ) : (
              <>
                <div className="max-h-[260px] overflow-y-auto space-y-2">
                  {messages.map((m) => {
                    const isAssistant = m.role === "assistant";
                    return (
                      <div key={m.id} className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                            isAssistant
                              ? "bg-[#f7f3ea] text-[#0a2225]"
                              : "bg-[#0c4d47] text-white"
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {requiresLogin ? (
                  <button
                    type="button"
                    onClick={() => navigate('/login?redirect=/concierge')}
                    className="w-full rounded-full bg-[#0c4d47] px-4 py-2 text-sm font-semibold text-[#E5DFC6]"
                  >
                    Sign in to plan with Madison
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={`Tell ${MADISON_NAME} what you're planning…`}
                      className="flex-1 rounded-full border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-1.5 text-xs outline-none placeholder:text-[#8D8D8D]"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={sending || !input.trim()}
                      className="rounded-full bg-[#0c4d47] p-1.5 text-white hover:bg-[#073331] disabled:opacity-40"
                    >
                      {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={listening ? stopListening : startListening}
                    className="text-xs text-[#6B7280] hover:text-[#0a2225] transition-colors"
                  >
                    {listening ? (
                      <span className="flex items-center gap-1"><MicOff className="h-3 w-3" /> Stop</span>
                    ) : (
                      <span className="flex items-center gap-1"><Mic className="h-3 w-3" /> Voice</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(sessionId ? `/concierge?sessionId=${sessionId}` : '/concierge')}
                    className="text-xs text-[#C7A962] hover:text-[#B39952] transition-colors"
                  >
                    Full view
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
