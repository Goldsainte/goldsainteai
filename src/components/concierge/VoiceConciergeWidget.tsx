import { useEffect, useState } from "react";
import { MessageCircle, X, Mic, MicOff, Music2, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MADISON_NAME, MADISON_VOICE_INTRO } from "@/lib/madisonPersona";
import { StartStoryboardFromChat } from "./StartStoryboardFromChat";

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
  const [musicOn, setMusicOn] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

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
      if (!user) return;

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

  const lastAssistantIndex = messages.reduce(
    (lastIdx, msg, i) => (msg.role === "assistant" ? i : lastIdx),
    -1
  );

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-4 py-2 text-[11px] font-semibold text-[#E5DFC6] shadow-lg hover:bg-[#073331]"
      >
        <MessageCircle className="h-4 w-4" />
        Hey Goldsainte
      </button>

      {/* Jazz background */}
      {musicOn && open && (
        <audio loop autoPlay className="hidden">
          <source src="/audio/jazz-lounge.mp3" type="audio/mpeg" />
        </audio>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-40 w-80 max-w-[90vw] rounded-3xl border border-[#E5DFC6] bg-[#0a2225] text-[#E5DFC6] shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#BFAD72]">
                Goldsainte Concierge
              </span>
              <span className="text-[12px] font-semibold">
                {MADISON_NAME}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMusicOn((m) => !m)}
                className="rounded-full bg-white/10 p-1 hover:bg-white/20"
                aria-label="Toggle music"
              >
                <Music2 className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full bg-white/10 p-1 hover:bg-white/20"
                aria-label="Close"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="px-3 pb-3 text-[11px]">
            {loading ? (
              <div className="flex items-center gap-2 py-4 text-[#E5DFC6]/70">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading conversation…
              </div>
            ) : (
              <>
                <div className="max-h-[240px] overflow-y-auto space-y-2 mb-3">
                  {messages.map((m, idx) => {
                    const isAssistant = m.role === "assistant";
                    const isLastAssistant = isAssistant && idx === lastAssistantIndex;

                    return (
                      <div key={m.id}>
                        <div
                          className={`rounded-2xl px-3 py-2 ${
                            isAssistant
                              ? "bg-[#E5DFC6]/10 text-[#E5DFC6]"
                              : "bg-[#BFAD72] text-[#0a2225] ml-auto max-w-[80%]"
                          }`}
                        >
                          {m.content}
                        </div>
                        {isLastAssistant && sessionId && (
                          <div className="mt-2 pt-2 border-t border-[#E5DFC6]/20">
                            <p className="mb-1 text-[10px] text-[#E5DFC6]/70">
                              Ready to see this as a visual plan?
                            </p>
                            <StartStoryboardFromChat
                              sessionId={sessionId}
                              ownerRole="traveler"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 mb-2">
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
                    className="flex-1 rounded-full border border-[#E5DFC6]/30 bg-[#0a2225] px-3 py-1.5 text-[10px] outline-none placeholder:text-[#E5DFC6]/50"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="rounded-full bg-[#BFAD72] p-1.5 hover:bg-[#d4c58d] disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-3 w-3 animate-spin text-[#0a2225]" />
                    ) : (
                      <Send className="h-3 w-3 text-[#0a2225]" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E5DFC6]/20">
                  <button
                    type="button"
                    onClick={listening ? stopListening : startListening}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] ${
                      listening
                        ? "bg-[#BFAD72] text-[#0a2225]"
                        : "bg-[#E5DFC6]/20 text-[#E5DFC6]"
                    }`}
                  >
                    {listening ? (
                      <>
                        <MicOff className="h-3 w-3" /> Stop
                      </>
                    ) : (
                      <>
                        <Mic className="h-3 w-3" /> Voice
                      </>
                    )}
                  </button>

                  {sessionId && (
                    <button
                      type="button"
                      onClick={() => navigate(`/concierge?sessionId=${sessionId}`)}
                      className="text-[10px] underline underline-offset-2 text-[#BFAD72] hover:text-[#d4c58d]"
                    >
                      Open full trip planner
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
