import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MessageSquare, Search, Trash2, Loader2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  title: string;
  preview: string | null;
  updated_at: string;
  messages: any[];
}

interface SearchHistorySidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  onNewChat: () => void;
}

export function SearchHistorySidebar({
  currentConversationId,
  onSelectConversation,
  onNewChat,
}: SearchHistorySidebarProps) {
  const { state } = useSidebar();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const collapsed = state === "collapsed";

  useEffect(() => {
    if (user) {
      loadConversations();
      subscribeToConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation history",
        variant: "destructive",
      });
    } else {
      setConversations((data || []) as Conversation[]);
    }
    setIsLoading(false);
  };

  const subscribeToConversations = () => {
    if (!user) return;

    const channel = supabase
      .channel("conversations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Conversation deleted successfully",
      });
      if (currentConversationId === id) {
        onNewChat();
      }
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.preview && conv.preview.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!user) return null;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <div className="flex flex-col h-full border-r bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          {!collapsed && (
            <Button
              onClick={onNewChat}
              className="flex-1 mr-2"
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          )}
          <SidebarTrigger />
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        )}

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <SidebarContent>
            <SidebarGroup>
              {!collapsed && (
                <SidebarGroupLabel className="px-3 py-2">
                  Recent Chats
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  !collapsed && (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                      {searchQuery
                        ? "No conversations found"
                        : "No chat history yet. Start a new chat!"}
                    </div>
                  )
                ) : (
                  <SidebarMenu>
                    {filteredConversations.map((conversation) => (
                      <SidebarMenuItem key={conversation.id}>
                        <SidebarMenuButton
                          onClick={() => onSelectConversation(conversation)}
                          className={`group relative ${
                            currentConversationId === conversation.id
                              ? "bg-muted text-primary font-medium"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <MessageSquare className="h-4 w-4 flex-shrink-0" />
                          {!collapsed && (
                            <>
                              <div className="flex-1 min-w-0 ml-2">
                                <div className="truncate text-sm font-medium">
                                  {conversation.title}
                                </div>
                                {conversation.preview && (
                                  <div className="truncate text-xs text-muted-foreground">
                                    {conversation.preview}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {formatDistanceToNow(new Date(conversation.updated_at), {
                                    addSuffix: true,
                                  })}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 h-6 w-6 ml-1"
                                onClick={(e) =>
                                  handleDeleteConversation(conversation.id, e)
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </ScrollArea>
      </div>
    </Sidebar>
  );
}
