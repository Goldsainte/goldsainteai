// src/pages/TripChatPage.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, ArrowLeft, AlertCircle, Flag, AlertTriangle } from "lucide-react";
import { useTripRequestMessages } from "@/hooks/useTripRequestMessages";
import { validateChatMessage, validateOnPlatformMessage } from "@/utils/chatGuard";
import { useChatMessageSafety } from "@/hooks/useChatMessageSafety";
import { ReportModal } from "@/components/report/ReportModal";

type TripRequest = {
  id: string;
  user_id: string | null;
  title: string | null;
  destination: string | null;
  selected_proposal_id: string | null;
  status: string;
};

type TripProposal = {
  id: string;
  proposer_id: string;
  proposer_role: "agent" | "creator";
};

export default function TripChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<TripRequest | null>(null);
  const [proposal, setProposal] = useState<TripProposal | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { runCheck, logEvent } = useChatMessageSafety(id);

  // Use the messaging hook
  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
  } = useTripRequestMessages({
    tripRequestId: id,
    proposalId: proposal?.id,
    userId: currentUserId || undefined,
  });

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function load() {
      setLoading(true);

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (!userData?.user || userError) {
        navigate(`/login?redirect=/trip-request/${id}/chat`, {
          replace: true,
        });
        return;
      }
      if (isMounted) setCurrentUserId(userData.user.id);

      const { data: tripData, error: tripError } = await supabase
        .from("trip_requests")
        .select(
          "id, user_id, title, destination, selected_proposal_id, status"
        )
        .eq("id", id)
        .maybeSingle();

      if (!isMounted) return;

      if (tripError || !tripData) {
        console.error("Error loading trip:", tripError);
        setError("Trip not found.");
        setLoading(false);
        return;
      }
      setTrip(tripData as TripRequest);

      if (!tripData.selected_proposal_id) {
        setError(
          "Chat is available once you've accepted a proposal for this trip."
        );
        setLoading(false);
        return;
      }

      const { data: proposalData, error: proposalError } = await supabase
        .from("trip_proposals")
        .select("id, proposer_id, proposer_role")
        .eq("id", tripData.selected_proposal_id)
        .maybeSingle();

      if (!proposalData || proposalError) {
        console.error("Error loading proposal:", proposalError);
        setError("Accepted proposal not found.");
        setLoading(false);
        return;
      }

      setProposal(proposalData as TripProposal);

      // Check participation rights
      const isTraveler = tripData.user_id === userData.user.id;
      const isProposer = proposalData.proposer_id === userData.user.id;
      if (!isTraveler && !isProposer) {
        setError("You don't have access to this chat.");
        setLoading(false);
        return;
      }

      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    setTimeout(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!trip || !proposal || !currentUserId) return;
    if (!inputValue.trim()) return;

    const body = inputValue.trim();

    // Run safety check
    const safety = runCheck(body);
    if (safety.hasIssues) {
      setSafetyWarning(
        "For everyone's safety, please keep messaging and payments inside Goldsainte and avoid sharing phone numbers, personal emails or external payment details."
      );
      await logEvent(safety.issues, body);
    } else {
      setSafetyWarning(null);
    }

    const validation = validateChatMessage(body);
    if (!validation.valid) {
      setError(validation.error || "Message cannot be sent.");
      return;
    }

    const guardError = validateOnPlatformMessage(body);
    if (guardError) {
      setError(guardError);
      return;
    }

    setInputValue("");
    setError(null);

    const result = await sendMessage(body, proposal.id);
    if (!result) {
      setError("Could not send message. Please try again.");
      setInputValue(body); // Restore message on error
    }
  }

  if (loading || messagesLoading) {
    return (
      <main className="min-h-screen bg-[#0a2225] text-[#E5DFC6]">
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm">
          Loading chat…
        </div>
      </main>
    );
  }

  if (!trip || !proposal || error) {
    return (
      <main className="min-h-screen bg-[#0a2225] text-[#E5DFC6]">
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm space-y-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-[11px] text-[#E5DFC6]/80 hover:text-white"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
          <p>{error || "Chat is not available."}</p>
        </div>
      </main>
    );
  }

  const isTraveler = trip.user_id === currentUserId;

  return (
    <>
      <Helmet>
        <title>Trip Chat · Goldsainte</title>
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-[#0a2225] via-[#0a2225] to-[#E5DFC6] text-[#E5DFC6]">
        <div className="mx-auto flex h-screen max-h-[calc(100vh-40px)] max-w-4xl flex-col px-4 py-6">
          {/* Header */}
          <header className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-[#E5DFC6] hover:bg-black/50"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium">
                  <MessageCircle className="h-3 w-3 text-[#BFAD72]" />
                  <span>Trip chat</span>
                </div>
                <p className="mt-1 text-xs font-medium">
                  {trip.title || trip.destination || "Goldsainte trip"}
                </p>
                <p className="text-[11px] text-[#E5DFC6]/70">
                  {isTraveler
                    ? "You're chatting with your selected creator/agent."
                    : "You're chatting with the traveler for this trip."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] text-[#E5DFC6]/70 hover:text-[#E5DFC6]"
            >
              <Flag className="h-3 w-3" />
              <span>Report</span>
            </button>
          </header>

          {/* Chat safety banner */}
          <div className="mb-3 rounded-2xl border border-[#BFAD72]/40 bg-black/40 px-3 py-2 text-[10px]">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-[#BFAD72] flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-[#E5DFC6]">Stay in the room.</p>
                <p className="text-[#E5DFC6]/80">
                  For everyone's safety, keep messaging and payments inside Goldsainte.
                  Sharing phone numbers, personal emails, social handles or external
                  payment links in chat is not allowed.{" "}
                  <Link to="/marketplace-guidelines" className="text-[#BFAD72] underline">
                    Learn more
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto rounded-3xl border border-[#BFAD72]/40 bg-[#0a2225]/95 p-4">
            {messages.length === 0 ? (
              <p className="text-center text-[11px] text-[#E5DFC6]/70">
                No messages yet. Start the conversation below.
              </p>
            ) : (
              <div className="space-y-2">
                {messages.map((m) => {
                  const isMine = m.sender_id === currentUserId;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
                          isMine
                            ? "bg-[#BFAD72] text-[#0a2225] rounded-br-sm"
                            : "bg-black/40 text-[#E5DFC6] rounded-bl-sm"
                        }`}
                      >
                        <p>{m.body}</p>
                        <p
                          className={`mt-1 text-[9px] ${
                            isMine
                              ? "text-[#0a2225]/70"
                              : "text-[#E5DFC6]/60"
                          }`}
                        >
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="mt-3 rounded-3xl border border-[#BFAD72]/40 bg-[#0a2225]/95 p-3 text-xs"
          >
            {safetyWarning && (
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-[#BFAD72]/40 bg-[#BFAD72]/10 px-3 py-2 text-[10px] text-[#E5DFC6]">
                <AlertTriangle className="h-3 w-3 text-[#BFAD72] flex-shrink-0" />
                <span>{safetyWarning}</span>
              </div>
            )}
            {error && (
              <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {error}
              </div>
            )}
            <Textarea
              rows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message…"
              className="mb-2 rounded-2xl border border-[#BFAD72]/30 bg-black/40 text-xs text-[#E5DFC6] placeholder:text-[#E5DFC6]/60"
            />
            <div className="mb-2 rounded-lg border border-[#BFAD72]/20 bg-[#BFAD72]/5 px-3 py-2">
              <p className="text-[10px] text-[#E5DFC6]/80 leading-relaxed">
                🔒 <strong>Keep it safe:</strong> For your protection and to support our creators and agents, all communication must stay on Goldsainte. Phone numbers, emails, and off-platform contact will be blocked.
              </p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-[#E5DFC6]/70">
                Keep all trip details here so it's easy to refer back later.
              </p>
              <Button
                type="submit"
                disabled={!inputValue.trim()}
                className="inline-flex items-center justify-center rounded-full bg-[#BFAD72] px-4 py-1.5 text-xs font-semibold text-[#0a2225] hover:bg-[#d4c58d] disabled:opacity-60"
              >
                Send
              </Button>
            </div>
          </form>
        </div>

        <ReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          context={{
            conversationId: id,
            reportedUserId: isTraveler ? proposal?.proposer_id : trip?.user_id,
          }}
        />
      </main>
    </>
  );
}
