import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  MessageCircle,
  Inbox,
  Archive,
  Settings,
  Send,
  Check,
  CheckCheck,
  Shield,
  MoreVertical,
  Ban,
  PenSquare,
} from "lucide-react";
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

export function DirectMessageInbox() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("primary");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRecipientSearch, setShowRecipientSearch] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setSearchParams({ conversation: conv.id });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await sendMessage(
        selectedConversation.otherParticipant.id,
        newMessage.trim(),
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
    try {
      await manageConversation(selectedConversation.id, "accept");
      toast({ title: "Request accepted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C7A962]" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] border border-[#E5DFC6] rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Left Panel - Conversation List */}
      <div className="w-80 border-r border-[#E5DFC6] flex flex-col bg-[#FDFBF7]">
        <div className="p-4 border-b border-[#E5DFC6] flex items-center justify-between">
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
          <TabsList className="grid grid-cols-3 mx-4 mt-3 bg-[#F6F0E4] p-1 rounded-full">
            <TabsTrigger 
              value="primary" 
              className="text-xs rounded-full data-[state=active]:bg-white data-[state=active]:text-[#0a2225] data-[state=active]:shadow-sm text-[#5a6c6e]"
            >
              <Inbox className="h-3 w-3 mr-1" />
              Primary
              {totalUnread > 0 && (
                <Badge className="ml-1 h-4 px-1 text-[10px] bg-[#0a2225] text-white">
                  {totalUnread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="requests" 
              className="text-xs rounded-full data-[state=active]:bg-white data-[state=active]:text-[#0a2225] data-[state=active]:shadow-sm text-[#5a6c6e]"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Requests
              {requestCount > 0 && (
                <Badge className="ml-1 h-4 px-1 text-[10px] bg-[#C7A962] text-white">
                  {requestCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="archived" 
              className="text-xs rounded-full data-[state=active]:bg-white data-[state=active]:text-[#0a2225] data-[state=active]:shadow-sm text-[#5a6c6e]"
            >
              <Archive className="h-3 w-3 mr-1" />
              Archived
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-3">
            <div className="px-3">
              {getConversationList().length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-10 w-10 mx-auto mb-3 text-[#C7A962] opacity-50" />
                  <p className="font-secondary text-[#0a2225] text-sm">
                    {activeTab === "requests"
                      ? "No message requests"
                      : activeTab === "archived"
                      ? "No archived conversations"
                      : "No conversations yet"}
                  </p>
                  <p className="text-xs text-[#5a6c6e] mt-1">
                    {activeTab === "primary" 
                      ? "Click 'New' above to start a conversation"
                      : activeTab === "requests"
                      ? "Message requests will appear here"
                      : "Archived messages will appear here"}
                  </p>
                </div>
              ) : (
                getConversationList().map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={selectedConversation?.id === conv.id}
                    onClick={() => handleSelectConversation(conv)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Right Panel - Messages */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-[#E5DFC6] flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-[#E5DFC6]">
                  <AvatarImage src={selectedConversation.otherParticipant.avatarUrl || undefined} />
                  <AvatarFallback className="bg-[#F6F0E4] text-[#0a2225] font-secondary">
                    {selectedConversation.otherParticipant.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-secondary font-medium text-[#0a2225]">
                      {selectedConversation.otherParticipant.displayName}
                    </span>
                    {selectedConversation.otherParticipant.isVerified && (
                      <Badge className="text-[10px] h-4 bg-[#C7A962]/10 text-[#C7A962] border-0">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-[#5a6c6e] capitalize">
                    {selectedConversation.otherParticipant.accountType || "User"}
                  </span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#5a6c6e] hover:text-[#0a2225] hover:bg-[#F6F0E4]">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-[#E5DFC6]">
                  <DropdownMenuItem onClick={handleArchive} className="text-[#0a2225]">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBlock} className="text-red-600">
                    <Ban className="h-4 w-4 mr-2" />
                    Block User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Request Banner */}
            {isRequest && (
              <div className="p-4 bg-[#F6F0E4] border-b border-[#E5DFC6]">
                <div className="flex items-center gap-2 text-sm mb-3">
                  <Shield className="h-4 w-4 text-[#C7A962]" />
                  <span className="text-[#5a6c6e]">
                    This is a message request. Accept to continue the conversation.
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleAcceptRequest}
                    className="bg-[#0a2225] hover:bg-[#0a2225]/90 text-white rounded-full"
                  >
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDeclineRequest}
                    className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4] rounded-full"
                  >
                    Decline
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleBlock}
                    className="text-[#5a6c6e] hover:text-red-600 hover:bg-red-50 rounded-full"
                  >
                    Block
                  </Button>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-[#FDFBF7]">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C7A962]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-10 w-10 mx-auto mb-3 text-[#C7A962] opacity-50" />
                  <p className="font-secondary text-[#0a2225] text-sm">No messages yet</p>
                  <p className="text-xs text-[#5a6c6e] mt-1">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isSelf={msg.sender_id === user?.id}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            {!isRequest && (
              <div className="p-4 border-t border-[#E5DFC6] bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]/20 rounded-full bg-[#FDFBF7]"
                    disabled={sending}
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || sending}
                    className="bg-[#0a2225] hover:bg-[#0a2225]/90 text-white rounded-full px-6"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#FDFBF7]">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-[#C7A962] opacity-50" />
              <p className="font-secondary text-[#0a2225]">Select a conversation</p>
              <p className="text-sm text-[#5a6c6e] mt-1">Choose from your messages on the left, or start a new one</p>
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
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl text-left transition-all mb-2 ${
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
              <span className="text-[10px] text-[#5a6c6e] whitespace-nowrap">
                {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
              </span>
            )}
          </div>
          <p className="text-xs text-[#5a6c6e] truncate mt-0.5">
            {conversation.lastMessagePreview || "No messages yet"}
          </p>
        </div>
        {conversation.unreadCount > 0 && (
          <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-[#0a2225] text-white">
            {conversation.unreadCount}
          </Badge>
        )}
      </div>
    </button>
  );
}

function MessageBubble({
  message,
  isSelf,
}: {
  message: { id: string; body: string; created_at: string; is_read: boolean };
  isSelf: boolean;
}) {
  return (
    <div className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
          isSelf
            ? "bg-[#0a2225] text-white"
            : "bg-white border border-[#E5DFC6]"
        }`}
      >
        <p className={`text-sm whitespace-pre-wrap ${isSelf ? "text-white" : "text-[#0a2225]"}`}>
          {message.body}
        </p>
        <div className={`flex items-center gap-1 mt-1 ${isSelf ? "justify-end" : "justify-start"}`}>
          <span className={`text-[10px] ${isSelf ? "text-white/70" : "text-[#5a6c6e]"}`}>
            {format(new Date(message.created_at), "HH:mm")}
          </span>
          {isSelf && (
            message.is_read ? (
              <CheckCheck className="h-3 w-3 text-white/70" />
            ) : (
              <Check className="h-3 w-3 text-white/70" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
