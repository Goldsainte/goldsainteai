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
  Trash2,
  Ban,
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

export function DirectMessageInbox() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("primary");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
        // Switch to appropriate tab
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] border rounded-2xl overflow-hidden bg-card">
      {/* Left Panel - Conversation List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-secondary text-lg font-semibold">Messages</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 mx-4 mt-2">
            <TabsTrigger value="primary" className="text-xs">
              <Inbox className="h-3 w-3 mr-1" />
              Primary
              {totalUnread > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                  {totalUnread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-xs">
              <MessageCircle className="h-3 w-3 mr-1" />
              Requests
              {requestCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {requestCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">
              <Archive className="h-3 w-3 mr-1" />
              Archived
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-2">
            <div className="px-2">
              {getConversationList().length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {activeTab === "requests"
                    ? "No message requests"
                    : activeTab === "archived"
                    ? "No archived conversations"
                    : "No conversations yet"}
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
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.otherParticipant.avatarUrl || undefined} />
                  <AvatarFallback>
                    {selectedConversation.otherParticipant.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {selectedConversation.otherParticipant.displayName}
                    </span>
                    {selectedConversation.otherParticipant.isVerified && (
                      <Badge variant="secondary" className="text-[10px] h-4">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {selectedConversation.otherParticipant.accountType || "User"}
                  </span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBlock} className="text-destructive">
                    <Ban className="h-4 w-4 mr-2" />
                    Block User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Request Banner */}
            {isRequest && (
              <div className="p-4 bg-muted/50 border-b">
                <div className="flex items-center gap-2 text-sm mb-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    This is a message request. Accept to continue the conversation.
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAcceptRequest}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDeclineRequest}>
                    Decline
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleBlock}>
                    Block
                  </Button>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No messages yet. Start the conversation!
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
              <div className="p-4 border-t">
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
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button type="submit" disabled={!newMessage.trim() || sending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      <MessageSettingsModal open={showSettings} onOpenChange={setShowSettings} />
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
      className={`w-full p-3 rounded-lg text-left transition-colors mb-1 ${
        isActive ? "bg-primary/10" : "hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.otherParticipant.avatarUrl || undefined} />
          <AvatarFallback>
            {conversation.otherParticipant.displayName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium truncate text-sm">
              {conversation.otherParticipant.displayName}
            </span>
            {conversation.lastMessageAt && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {conversation.lastMessagePreview || "No messages yet"}
          </p>
        </div>
        {conversation.unreadCount > 0 && (
          <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
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
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isSelf
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
        <div className={`flex items-center gap-1 mt-1 ${isSelf ? "justify-end" : "justify-start"}`}>
          <span className={`text-[10px] ${isSelf ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {format(new Date(message.created_at), "HH:mm")}
          </span>
          {isSelf && (
            message.is_read ? (
              <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
            ) : (
              <Check className="h-3 w-3 text-primary-foreground/70" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
