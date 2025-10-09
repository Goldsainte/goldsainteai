import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ConversationsList } from "@/components/ConversationsList";
import { MessageThread } from "@/components/MessageThread";
import { NotificationCenter } from "@/components/NotificationCenter";
import { QuickReplyManager } from "@/components/QuickReplyManager";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Messages = () => {
  const { user } = useAuth();
  const { isAgent, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [agentId, setAgentId] = useState<string | undefined>();

  useEffect(() => {
    if (!user && !roleLoading) {
      navigate("/auth");
    }
  }, [user, roleLoading, navigate]);

  useEffect(() => {
    const fetchAgentId = async () => {
      if (user && isAgent) {
        const { data } = await supabase
          .from("travel_agents")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (data) {
          setAgentId(data.id);
        }
      }
    };

    fetchAgentId();
  }, [user, isAgent]);

  if (!user || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">
          Chat with {isAgent ? "customers" : "agents"}, manage notifications, and stay connected
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Conversations & Notifications */}
        <div className="lg:col-span-3 space-y-6">
          <ConversationsList
            userId={user.id}
            userType={isAgent ? "agent" : "customer"}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
          />
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-6">
          {selectedConversationId ? (
            <MessageThread
              conversationId={selectedConversationId}
              userId={user.id}
              userType={isAgent ? "agent" : "customer"}
            />
          ) : (
            <div className="h-[600px] border rounded-lg flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">No conversation selected</p>
                <p className="text-sm">Select a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Quick Replies (Agents Only) */}
        {isAgent && agentId && (
          <div className="lg:col-span-3">
            <QuickReplyManager
              agentId={agentId}
              onSelectTemplate={(content) => {
                // This would be used to insert template into message input
                console.log("Selected template:", content);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
