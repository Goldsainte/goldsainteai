import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin,
  Users,
  Calendar,
  DollarSign,
  Tag,
  MessageCircle,
  FileText,
  ExternalLink,
  Send,
} from "lucide-react";
import { TripStatusControls } from "@/components/trips/TripStatusControls";
import { useTripRequestMessages } from "@/hooks/useTripRequestMessages";
import { TripChatProposal } from "@/components/trips/TripChatProposal";
import { TripBookingPanel } from "@/components/trips/TripBookingPanel";
import type { TripRequestStatus, TripRole } from "@/lib/trips/statusMachine";
import { toast } from "@/hooks/use-toast";

export interface TripRequestDetail {
  id: string;
  created_at: string;
  status: TripRequestStatus;
  user_name?: string | null;
  brand_profile_id: string | null;
  brand_name: string | null;
  brand_avatar_url?: string | null;
  collection_id: string | null;
  collection_title: string | null;
  collection_tags: string[] | null;
  destination: string | null;
  date_range: string | null;
  travelers_count: number | null;
  budget_range: string | null;
  notes: string | null;
  // Proposal and booking info
  accepted_proposal_id?: string | null;
  accepted_at?: string | null;
  accepted_proposal?: {
    id: string;
    status: string;
    headline: string | null;
    price_from: number | null;
    currency: string | null;
  } | null;
  trip_bookings?: Array<{
    id: string;
    status: string;
    total_price: number;
    currency: string;
    payment_url?: string | null;
    platform_commission?: number;
    partner_payout?: number;
  }>;
}

interface TripRequestDrawerProps {
  open: boolean;
  onClose: () => void;
  role: TripRole;
  trip: TripRequestDetail;
}

interface InternalNote {
  id: string;
  note: string;
  created_at: string;
  author_user_id: string;
}

export function TripRequestDrawer({
  open,
  onClose,
  role,
  trip,
}: TripRequestDrawerProps) {
  const [currentStatus, setCurrentStatus] = useState<TripRequestStatus>(
    trip.status
  );
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [booking, setBooking] = useState<any>(trip.trip_bookings?.[0] || null);

  // Get current user for chat
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id || null);
    });
  }, []);

  // Use existing chat hook
  const { messages, isLoading: messagesLoading, sendMessage } = useTripRequestMessages({
    tripRequestId: trip.id,
    userId: currentUserId || undefined,
  });

  // Load internal notes
  useEffect(() => {
    if (!open) return;
    
    supabase
      .from("trip_internal_notes")
      .select("*")
      .eq("trip_request_id", trip.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setInternalNotes(data as InternalNote[]);
        }
      });
  }, [trip.id, open]);

  const displayDate = new Date(trip.created_at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const tags = trip.collection_tags ?? [];

  const handleSaveNote = async () => {
    if (!newNote.trim() || !currentUserId) return;
    setSavingNote(true);
    try {
      const { data, error } = await supabase
        .from("trip_internal_notes")
        .insert([{
          trip_request_id: trip.id,
          author_user_id: currentUserId,
          note: newNote.trim(),
        }])
        .select()
        .single();

      if (error) throw error;

      setInternalNotes((prev) => [data as InternalNote, ...prev]);
      setNewNote("");
      toast({
        title: "Note saved",
        description: "Internal note added successfully",
      });
    } catch (err) {
      console.error("Failed to save note", err);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    } finally {
      setSavingNote(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !currentUserId) return;

    const content = messageContent.trim();
    setMessageContent("");
    
    const result = await sendMessage(content);
    if (!result) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-4xl border-l border-[#E5DFC6] bg-[#FDFBF5] p-0"
      >
        <SheetHeader className="border-b border-[#E5DFC6] px-6 py-4">
          <SheetTitle className="text-sm font-semibold text-[#0a2225]">
            Trip request · {trip.user_name ?? "Goldsainte traveler"}
          </SheetTitle>
          <SheetDescription className="text-[11px] text-[#8C8470]">
            Created {displayDate}
          </SheetDescription>
        </SheetHeader>

        <div className="flex h-[calc(100vh-88px)] flex-col gap-4 overflow-y-auto px-6 py-4">
          {/* Top: Brand + collection + status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-[#F5F0E0]">
                {trip.brand_avatar_url ? (
                  <img
                    src={trip.brand_avatar_url}
                    alt={trip.brand_name ?? "Brand"}
                    className="h-full w-full object-cover"
                  loading="lazy"/>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#0a2225]">
                    {(trip.brand_name ?? "GS").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#7A7151]">
                  {trip.brand_name ?? "Goldsainte Brand"}
                </p>
                {trip.collection_title && (
                  <p className="text-xs text-[#4a4a4a]">
                    Collection:{" "}
                    <span className="font-semibold">
                      "{trip.collection_title}"
                    </span>
                  </p>
                )}
                {trip.collection_id && trip.brand_profile_id && (
                  <Link
                    to={`/brands/${trip.brand_profile_id}/collections/${trip.collection_id}`}
                    className="inline-flex items-center gap-1 text-[11px] text-[#7A7151] underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View collection
                  </Link>
                )}
              </div>
            </div>

            <TripStatusControls
              tripRequestId={trip.id}
              status={currentStatus}
              role={role}
              onStatusChange={setCurrentStatus}
            />
          </div>

          {/* Trip summary */}
          <div className="space-y-3 rounded-2xl border border-[#E5DFC6] bg-white px-4 py-4">
            <div className="flex flex-wrap gap-2">
              {trip.destination && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-3 py-1.5 text-xs">
                  <MapPin className="h-3.5 w-3.5 text-[#BFAD72]" />
                  {trip.destination}
                </span>
              )}
              {trip.date_range && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-3 py-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-[#BFAD72]" />
                  {trip.date_range}
                </span>
              )}
              {typeof trip.travelers_count === "number" &&
                trip.travelers_count > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-3 py-1.5 text-xs">
                    <Users className="h-3.5 w-3.5 text-[#BFAD72]" />
                    {trip.travelers_count} traveler
                    {trip.travelers_count > 1 ? "s" : ""}
                  </span>
                )}
              {trip.budget_range && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-3 py-1.5 text-xs">
                  <DollarSign className="h-3.5 w-3.5 text-[#BFAD72]" />
                  {trip.budget_range}
                </span>
              )}
            </div>

            {trip.notes && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7A7151]">
                  Traveler notes
                </p>
                <p className="whitespace-pre-line text-sm text-[#0a2225]">
                  {trip.notes}
                </p>
              </div>
            )}

            {tags.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7A7151]">
                  Vibe & tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border border-[#E5DFC6] bg-[#FDFBF5] px-2.5 py-1 text-[11px]"
                    >
                      <Tag className="h-3 w-3 text-[#7A7151]" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle: Chat + internal notes/files */}
          <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {/* Chat panel */}
            <div className="flex flex-col rounded-2xl border border-[#E5DFC6] bg-white">
              <div className="flex items-center justify-between border-b border-[#E5DFC6] px-4 py-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-[#7A7151]" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                    Conversation
                  </p>
                </div>
              </div>

              <ScrollArea className="flex-1 px-4 py-3">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8 text-xs text-[#8C8470]">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-xs text-[#8C8470]">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_id === currentUserId
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                            msg.sender_id === currentUserId
                              ? "bg-[#BFAD72] text-[#0C4D47]"
                              : "bg-[#F5F0E0] text-[#0a2225]"
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.body}</p>
                          <p className="mt-1 text-[10px] opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString(
                              undefined,
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="border-t border-[#E5DFC6] p-3">
                <div className="flex gap-2">
                  <Textarea
                    rows={2}
                    placeholder="Type a message..."
                    className="resize-none text-sm"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim()}
                    className="bg-[#BFAD72] text-[#0C4D47] hover:bg-[#A89B65]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: internal notes + files */}
            <div className="flex flex-col gap-3">
              {/* Internal notes */}
              <div className="flex flex-col rounded-2xl border border-[#E5DFC6] bg-white">
                <div className="border-b border-[#E5DFC6] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                    Internal notes
                  </p>
                </div>
                <div className="space-y-3 px-4 py-3">
                  <Textarea
                    rows={3}
                    placeholder="Add strategy notes, talking points, or partner details (visible only to the Goldsainte team)."
                    className="resize-none text-xs"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={savingNote || !newNote.trim()}
                      onClick={handleSaveNote}
                    >
                      {savingNote ? "Saving…" : "Save note"}
                    </Button>
                  </div>

                  {internalNotes.length > 0 && (
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {internalNotes.map((note) => (
                          <div
                            key={note.id}
                            className="rounded-lg border border-[#E5DFC6] bg-[#FDFBF5] p-2"
                          >
                            <p className="text-xs text-[#0a2225]">
                              {note.note}
                            </p>
                            <p className="mt-1 text-[10px] text-[#8C8470]">
                              {new Date(note.created_at).toLocaleString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>

              {/* Itinerary & files — pending dedicated attachments UX */}

              {/* Booking & Payment */}
              <TripBookingPanel
                tripRequestId={trip.id}
                booking={booking}
                acceptedAt={trip.accepted_at}
                onBookingUpdated={(updated) => setBooking(updated)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[#E5DFC6] pt-3">
            <p className="text-[11px] text-[#8C8470]">
              Keep status updated so brands and the Goldsainte team can track
              progress.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
