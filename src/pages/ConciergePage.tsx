import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { MADISON_NAME, MADISON_PLANNER_INTRO } from "@/lib/madisonPersona";
import { Loader2, Send, Plane, Sparkles, LayoutTemplate } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export default function ConciergePage() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth?redirect=/concierge");
        return;
      }

      // Load or create latest session
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
            mode: "planner",
            title: "Trip planning with Madison",
          })
          .select("id")
          .single();

        if (error) {
          console.error(error);
        } else {
          sid = created.id;
        }
      }

      if (!sid) {
        setLoading(false);
        return;
      }

      setSessionId(sid);

      const { data: msgs } = await supabase
        .from("concierge_messages")
        .select("id, role, content, created_at")
        .eq("session_id", sid)
        .order("created_at", { ascending: true });

      const initialMessages: Message[] = msgs as any;

      if (!initialMessages.some((m) => m.role === "assistant")) {
        initialMessages.push({
          id: "intro",
          role: "assistant",
          content: MADISON_PLANNER_INTRO.trim(),
          created_at: new Date().toISOString(),
        });
      }

      setMessages(initialMessages);
      setLoading(false);
    })();
  }, [navigate]);

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

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-10">
        <div className="mb-6 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#8D8D8D]">
            Goldsainte Concierge
          </p>
          <h1 className="font-display text-[26px] md:text-[30px] leading-snug">
            Plan with {MADISON_NAME}
          </h1>
          <p className="max-w-xl text-[12px] text-[#4a4a4a]">
            A calm, human-feeling assistant for every part of your trip. Ask{" "}
            {MADISON_NAME} to sketch a first itinerary, refine a brief for creators
            and agents, or shape a storyboard from the content and ideas you
            already love.
          </p>
        </div>

        {/* Quick actions */}
        <div className="mb-6 grid gap-3 md:grid-cols-3 text-[11px]">
          <Link
            to="/post-trip"
            className="flex items-center gap-2 rounded-2xl border border-[#E5DFC6] bg-white/90 px-3 py-2 hover:border-[#BFAD72]"
          >
            <Sparkles className="h-4 w-4 text-[#0c4d47]" />
            <div>
              <p className="font-semibold">Post a new trip</p>
              <p className="text-[10px] text-[#8D8D8D]">
                Turn today's idea into a brief Madison can refine.
              </p>
            </div>
          </Link>

          <Link
            to="/tiktok-lab/storyboards"
            className="flex items-center gap-2 rounded-2xl border border-[#E5DFC6] bg-white/90 px-3 py-2 hover:border-[#BFAD72]"
          >
            <LayoutTemplate className="h-4 w-4 text-[#0c4d47]" />
            <div>
              <p className="font-semibold">Open my storyboards</p>
              <p className="text-[10px] text-[#8D8D8D]">
                Let Madison help refine or simplify what you've already started.
              </p>
            </div>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 rounded-2xl border border-[#E5DFC6] bg-white/90 px-3 py-2 hover:border-[#BFAD72]"
          >
            <Plane className="h-4 w-4 text-[#0c4d47]" />
            <div>
              <p className="font-semibold">Flights & stays</p>
              <p className="text-[10px] text-[#8D8D8D]">
                Ask Madison to interpret results or compare options.
              </p>
            </div>
          </Link>
        </div>

        {/* Chat area */}
        <div className="rounded-[32px] border border-[#E5DFC6] bg-white/95 p-4 md:p-5">
          <div className="mb-3 max-h-[360px] overflow-y-auto space-y-3 text-[11px]">
            {loading ? (
              <p className="text-[#8D8D8D] flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading your previous
                conversations…
              </p>
            ) : messages.length === 0 ? (
              <p className="text-[#8D8D8D]">
                Tell {MADISON_NAME} what you're dreaming about — a place, a
                celebration, a TikTok that got stuck in your head — and we'll
                begin shaping it together.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                      m.role === "assistant"
                        ? "bg-[#f7f3ea] text-[#0a2225]"
                        : "bg-[#0c4d47] text-[#E5DFC6]"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="mt-3 flex items-center gap-2">
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
              className="flex-1 rounded-full border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none placeholder:text-[#8D8D8D]"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="inline-flex items-center gap-1 rounded-full bg-[#0c4d47] px-4 py-2 text-[11px] text-[#E5DFC6] disabled:opacity-60"
            >
              {sending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Send className="h-3 w-3" /> Send
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
