import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { format, formatDistanceToNow, isToday, isYesterday, isSameDay } from "date-fns";
import {
  Archive,
  Settings,
  Send,
  Check,
  CheckCheck,
  Shield,
  MoreVertical,
  Ban,
  PenSquare,
  Loader2,
  Trash2,
  HandCoins,
  ArrowLeft,
  Plane,
  SmilePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import {
  useDirectMessages,
  useConversationMessages,
  type Conversation,
} from "@/hooks/useDirectMessages";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSettingsModal } from "./MessageSettingsModal";
import { RecipientSearchModal } from "./RecipientSearchModal";
import { NewMessageModal } from "./NewMessageModal";
import { ProposalComposer } from "./ProposalComposer";
import { ProposalMessageCard } from "./ProposalMessageCard";
import { supabase } from "@/integrations/supabase/client";

export function DirectMessageInbox() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("primary");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRecipientSearch, setShowRecipientSearch] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; name: string } | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showProposalComposer, setShowProposalComposer] = useState(false);
  const [currentUserAccountType, setCurrentUserAccountType] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    conversations,
    totalUnread,
    requestCount,
    loading,
    sendMessage,
    manageConversation,
  } = useDirectMessages();

  const { messages, loading: messagesLoading } = useConversationMessages(
    selectedConversation?.id || null
  );

  // Load current user's account_type for agent gating
  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setCurrentUserAccountType((data as any)?.account_type ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isAgent =
    currentUserAccountType === "agent" ||
    currentUserAccountType === "travel_agent" ||
    currentUserAccountType === "admin";

  // Reset composer visibility when switching conversation
  useEffect(() => {
    setShowProposalComposer(false);
  }, [selectedConversation?.id]);

  // Typing indicator via broadcast
  const broadcastTyping = useCallback(() => {
    if (!selectedConversation || !user) return;
    const channel = supabase.channel(`typing-${selectedConversation.id}`);
    channel.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: user.id },
    });
  }, [selectedConversation, user]);

  // Listen for typing from other participant
  useEffect(() => {
    if (!selectedConversation || !user) return;
    const channelName = `typing-${selectedConversation.id}`;
    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.userId !== user.id) {
          setOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 2500);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      setOtherTyping(false);
    };
  }, [selectedConversation?.id, user]);

  // Handle URL param for conversation
  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    if (conversationId && !selectedConversation) {
      const allConversations = [
        ...conversations.primary,
        ...conversations.requests,
        ...conversations.archived,
      ];
      const found = allConversations.find((c) => c.id === conversationId);
      if (found) {
        setSelectedConversation(found);
        if (conversations.requests.some((c) => c.id === conversationId)) {
          setActiveTab("requests");
        } else if (conversations.archived.some((c) => c.id === conversationId)) {
          setActiveTab("archived");
        }
      }
    }
  }, [searchParams, conversations, selectedConversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when viewing conversation
  useEffect(() => {
    if (selectedConversation && selectedConversation.unreadCount > 0) {
      manageConversation(selectedConversation.id, "mark_read");
    }
  }, [selectedConversation]);

  // Auto-focus input when conversation selected
  useEffect(() => {
    if (selectedConversation && selectedConversation.status !== "request") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedConversation]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setSearchParams({ conversation: conv.id });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const trimmed = newMessage.trim();
    if (trimmed.length < 1 || trimmed.length > 2000) {
      toast({
        title: "Invalid message",
        description: "Message must be between 1 and 2000 characters.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      await sendMessage(
        selectedConversation.otherParticipant.id,
        trimmed,
        selectedConversation.id
      );
      setNewMessage("");
    } catch (e: any) {
      toast({
        title: "Failed to send",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!selectedConversation) return;
    setAcceptingRequest(true);
    
    // Optimistically update
    setSelectedConversation((prev) =>
      prev ? { ...prev, status: "active" } : prev
    );

    try {
      await manageConversation(selectedConversation.id, "accept");
      toast({ title: "Request accepted", description: "You can now message each other." });
      setTimeout(() => inputRef.current?.focus(), 200);
    } catch (e: any) {
      // Revert
      setSelectedConversation((prev) =>
        prev ? { ...prev, status: "request" } : prev
      );
      toast({ title: "Couldn't accept request", description: e.message, variant: "destructive" });
    } finally {
      setAcceptingRequest(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!selectedConversation) return;
    try {
      await manageConversation(selectedConversation.id, "decline");
      setSelectedConversation(null);
      toast({ title: "Request declined" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleBlock = async () => {
    if (!selectedConversation) return;
    try {
      await manageConversation(selectedConversation.id, "block");
      setSelectedConversation(null);
      toast({ title: "User blocked" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleArchive = async () => {
    if (!selectedConversation) return;
    try {
      await manageConversation(selectedConversation.id, "archive");
      setSelectedConversation(null);
      toast({ title: "Conversation archived" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("direct_messages")
        .update({ is_deleted: true })
        .eq("id", messageId)
        .eq("sender_id", user?.id);
      if (error) throw error;
      toast({ title: "Message deleted" });
    } catch (e: any) {
      toast({ title: "Couldn't delete message", description: e.message, variant: "destructive" });
    }
  };

  const getConversationList = () => {
    switch (activeTab) {
      case "requests":
        return conversations.requests;
      case "archived":
        return conversations.archived;
      default:
        return conversations.primary;
    }
  };

  const isRequest =
    selectedConversation?.status === "request" && !selectedConversation?.isInitiator;

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: Date; messages: typeof messages }[]>(
    (groups, msg) => {
      const msgDate = new Date(msg.created_at);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && isSameDay(lastGroup.date, msgDate)) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date: msgDate, messages: [msg] });
      }
      return groups;
    },
    []
  );

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C7A962]" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[500px] border border-[#E5DFC6]/60 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Left Panel - Conversation List */}
      <div
        className={cn(
          "w-full md:w-80 border-r border-[#E5DFC6]/50 flex-col bg-[#FDFBF7]",
          selectedConversation ? "hidden md:flex" : "flex"
        )}
      >
        <div className="p-4 border-b border-[#E5DFC6]/50 flex items-center justify-between">
          <h2 className="font-secondary text-lg font-semibold text-[#0a2225]">Inbox</h2>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowRecipientSearch(true)}
              className="text-[#C7A962] hover:text-[#0a2225] hover:bg-[#F6F0E4] gap-1.5"
            >
              <PenSquare className="h-4 w-4" />
              <span className="text-xs">New</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSettings(true)}
              className="text-[#5a6c6e] hover:text-[#0a2225] hover:bg-[#F6F0E4]"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="flex border-b border-[#E5DFC6]/40 mx-4 mt-2">
            <button
              onClick={() => setActiveTab("primary")}
              className={`flex-1 pb-2.5 text-xs font-medium tracking-wide transition-all border-b-2 ${
                activeTab === "primary"
                  ? "border-[#0a2225] text-[#0a2225]"
                  : "border-transparent text-[#9CA3AF] hover:text-[#5a6c6e]"
              }`}
            >
              Inbox
              {totalUnread > 0 && (
                <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-[#C7A962] text-white rounded-full">
                  {totalUnread}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 pb-2.5 text-xs font-medium tracking-wide transition-all border-b-2 ${
                activeTab === "requests"
                  ? "border-[#0a2225] text-[#0a2225]"
                  : "border-transparent text-[#9CA3AF] hover:text-[#5a6c6e]"
              }`}
            >
              Requests
              {requestCount > 0 && (
                <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-[#C7A962] text-white rounded-full">
                  {requestCount}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`flex-1 pb-2.5 text-xs font-medium tracking-wide transition-all border-b-2 ${
                activeTab === "archived"
                  ? "border-[#0a2225] text-[#0a2225]"
                  : "border-transparent text-[#9CA3AF] hover:text-[#5a6c6e]"
              }`}
            >
              Archive
            </button>
          </div>

          <ScrollArea className="flex-1 mt-3">
            <div className="px-3">
              {getConversationList().length === 0 ? (
                <div className="text-center py-16">
                  <p className="font-secondary text-[#0a2225] text-base">
                    {activeTab === "requests"
                      ? "No message requests"
                      : activeTab === "archived"
                      ? "No archived conversations"
                      : "No conversations yet"}
                  </p>
                  <p className="text-sm text-[#5a6c6e] mt-2 max-w-[220px] mx-auto leading-relaxed">
                    {activeTab === "primary" 
                      ? "Start a conversation with a creator or travel agent"
                      : activeTab === "requests"
                      ? "When someone new reaches out, you'll see it here"
                      : "Archived conversations will appear here"}
                  </p>
                </div>
              ) : (
                getConversationList().map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={selectedConversation?.id === conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    onDelete={activeTab === "archived" ? async () => {
                      try {
                        await manageConversation(conv.id, "delete");
                        if (selectedConversation?.id === conv.id) setSelectedConversation(null);
                        toast({ title: "Conversation deleted permanently" });
                      } catch (e: any) {
                        toast({ title: "Error", description: e.message, variant: "destructive" });
                      }
                    } : undefined}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Right Panel - Messages */}
      <div
        className={cn(
          "flex-1 flex-col bg-white",
          selectedConversation ? "flex" : "hidden md:flex"
        )}
      >
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-[#E5DFC6]/50 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedConversation(null);
                    setSearchParams({});
                  }}
                  className="md:hidden text-[#0a2225] hover:bg-[#F6F0E4] h-9 w-9 -ml-1"
                  aria-label="Back to inbox"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10 border-2 border-[#E5DFC6]">
                  <AvatarImage src={selectedConversation.otherParticipant.avatarUrl || undefined} />
                  <AvatarFallback className="bg-[#F6F0E4] text-[#0a2225] font-secondary">
                    {selectedConversation.otherParticipant.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-secondary font-semibold text-[#0a2225]">
                      {selectedConversation.otherParticipant.displayName}
                    </span>
                    {selectedConversation.otherParticipant.isVerified && (
                      <Shield className="h-3.5 w-3.5 text-[#C7A962]" />
                    )}
                  </div>
                  <span className="text-xs text-[#5a6c6e] capitalize">
                    {selectedConversation.otherParticipant.accountType === "travel_agent"
                      ? "Certified Travel Agent"
                      : selectedConversation.otherParticipant.accountType === "creator"
                      ? "Creator"
                      : selectedConversation.otherParticipant.accountType || "Member"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleArchive}
                  className="text-[#9CA3AF] hover:text-[#0a2225] hover:bg-[#F6F0E4]"
                  title="Archive"
                >
                  <Archive className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleBlock}
                  className="text-[#9CA3AF] hover:text-red-600 hover:bg-red-50"
                  title="Block"
                >
                  <Ban className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="xs" className="text-[#9CA3AF] hover:text-[#0a2225] hover:bg-[#F6F0E4]">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-[#E5DFC6]">
                    <DropdownMenuItem onClick={handleArchive} className="text-[#0a2225]">
                      <Archive className="h-4 w-4 mr-2" />
                      Archive conversation
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBlock} className="text-red-600">
                      <Ban className="h-4 w-4 mr-2" />
                      Block user
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      if (selectedConversation) {
                        manageConversation(selectedConversation.id, "delete");
                        setSelectedConversation(null);
                        toast({ title: "Conversation deleted" });
                      }
                    }} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Request Banner */}
            {isRequest && (
              <div className="p-5 bg-[#F6F0E4]/60 border-b border-[#E5DFC6]/40 transition-all duration-200">
                <div className="flex items-center gap-2.5 text-sm mb-4">
                  <Shield className="h-4 w-4 text-[#C7A962] flex-shrink-0" />
                  <span className="text-[#0a2225]">
                    This member would like to connect with you. Accept to begin the conversation.
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleAcceptRequest}
                    disabled={acceptingRequest}
                    className="bg-[#0a2225] hover:bg-[#0a2225]/90 text-white rounded-full min-w-[90px]"
                  >
                    {acceptingRequest ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Accept"
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDeclineRequest}
                    disabled={acceptingRequest}
                    className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4] rounded-full"
                  >
                    Decline
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleBlock}
                    disabled={acceptingRequest}
                    className="text-[#5a6c6e] hover:text-red-600 hover:bg-red-50 rounded-full"
                  >
                    Block
                  </Button>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-5 bg-white">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C7A962]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16">
                  <p className="font-secondary text-[#0a2225] text-base">No messages yet</p>
                  <p className="text-sm text-[#5a6c6e] mt-2">
                    Say hello to start the conversation
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {groupedMessages.map((group, gi) => (
                    <div key={gi}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center my-5">
                        <span className="text-[11px] text-[#9CA3AF] bg-white px-3 font-medium tracking-wide uppercase">
                          {formatDateLabel(group.date)}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {group.messages.map((msg) => (
                          (msg as any).message_type === "proposal" ? (
                            <div
                              key={msg.id}
                              className={`flex ${
                                msg.sender_id === user?.id ? "justify-end" : "justify-start"
                              }`}
                            >
                              <ProposalMessageCard
                                message={msg as any}
                                isSelf={msg.sender_id === user?.id}
                                currentUserId={user?.id || ""}
                                recipientId={
                                  selectedConversation!.otherParticipant.id
                                }
                              />
                            </div>
                          ) : (
                            <MessageBubble
                              key={msg.id}
                              message={msg}
                              isSelf={msg.sender_id === user?.id}
                              onDelete={handleDeleteMessage}
                            />
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                  {otherTyping && (
                    <div className="flex justify-start">
                      <div className="bg-[#F6F0E4] rounded-[1.25rem] px-4 py-3 text-sm text-[#5a6c6e] italic">
                        typing…
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input bar */}
            {!isRequest && (
              <div className="p-4 border-t border-[#E5DFC6]/40 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.03)]">
                {showProposalComposer && user && selectedConversation && (
                  <div className="mb-3 -mx-4 -mt-4">
                    <ProposalComposer
                      conversationId={selectedConversation.id}
                      senderId={user.id}
                      onClose={() => setShowProposalComposer(false)}
                    />
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  {isAgent && !showProposalComposer && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowProposalComposer(true)}
                      className="border-[#C7A962]/40 text-[#0c4d47] hover:bg-[#FDF9F0] rounded-full h-11 px-4"
                      title="Send a Proposal"
                    >
                      <HandCoins className="h-4 w-4 mr-1" />
                      <span className="text-xs">Send a Proposal</span>
                    </Button>
                  )}
                  <Input
                    ref={inputRef}
                    placeholder="Write something…"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      broadcastTyping();
                    }}
                    className="flex-1 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20 rounded-full bg-[#FDFBF7] h-11"
                    disabled={sending}
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || sending}
                    className="bg-[#0a2225] hover:bg-[#0a2225]/90 text-white rounded-full px-6 h-11"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center max-w-xs">
              <h3 className="font-secondary text-xl text-[#0a2225] mb-2">Your conversations</h3>
              <p className="text-sm text-[#5a6c6e] leading-relaxed">
                Pick up where you left off, or start something new.
              </p>
            </div>
          </div>
        )}
      </div>

      <MessageSettingsModal open={showSettings} onOpenChange={setShowSettings} />
      
      <RecipientSearchModal
        open={showRecipientSearch}
        onOpenChange={setShowRecipientSearch}
        onSelectRecipient={(recipient) => {
          setSelectedRecipient(recipient);
          setShowRecipientSearch(false);
        }}
      />

      {selectedRecipient && (
        <NewMessageModal
          open={!!selectedRecipient}
          onOpenChange={(open) => {
            if (!open) setSelectedRecipient(null);
          }}
          recipientId={selectedRecipient.id}
          recipientName={selectedRecipient.name}
        />
      )}
    </div>
  );
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full p-3 rounded-xl text-left transition-all mb-1.5 ${
          isActive 
            ? "bg-white border border-[#C7A962]/30 shadow-sm" 
            : "hover:bg-white/80 border border-transparent"
        }`}
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border-2 border-[#E5DFC6]">
            <AvatarImage src={conversation.otherParticipant.avatarUrl || undefined} />
            <AvatarFallback className="bg-[#F6F0E4] text-[#0a2225] font-secondary">
              {conversation.otherParticipant.displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-secondary font-medium truncate text-sm text-[#0a2225]">
                {conversation.otherParticipant.displayName}
              </span>
              {conversation.lastMessageAt && (
                <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap">
                  {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                </span>
              )}
            </div>
            <p className="text-xs text-[#5a6c6e] truncate mt-0.5">
              {conversation.lastMessagePreview || "No messages yet"}
            </p>
          </div>
          {conversation.unreadCount > 0 && (
            <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-[#C7A962] text-white rounded-full">
              {conversation.unreadCount}
            </Badge>
          )}
        </div>
      </button>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
          title="Delete permanently"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  isSelf,
  onDelete,
}: {
  message: { id: string; body: string; created_at: string; is_read: boolean };
  isSelf: boolean;
  onDelete?: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`flex items-center gap-1.5 ${isSelf ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isSelf && hovered && onDelete && (
        <button
          onClick={() => onDelete(message.id)}
          className="p-1.5 rounded-full text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Delete message"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
      <div
        className={`max-w-[70%] rounded-[1.25rem] px-4 py-3 ${
          isSelf
            ? "bg-[#E8DCC8] text-[#0a2225]"
            : "bg-[#F6F0E4] text-[#0a2225] border border-[#E5DFC6]/40"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed text-[#0a2225]">
          {message.body}
        </p>
        <div className={`flex items-center gap-1 mt-1.5 ${isSelf ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] text-[#9CA3AF]">
            {format(new Date(message.created_at), "HH:mm")}
          </span>
          {isSelf && (
            message.is_read ? (
              <CheckCheck className="h-3 w-3 text-[#C7A962]" />
            ) : (
              <Check className="h-3 w-3 text-[#9CA3AF]" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
