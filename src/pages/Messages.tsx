import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ConversationsList } from "@/components/ConversationsList";
import { MessageThread } from "@/components/MessageThread";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, MessageCircle, Edit } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

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
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar - Conversations */}
      <div className="w-full md:w-[400px] border-r flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">{user.email?.split('@')[0] || 'Messages'}</h1>
            <Button variant="ghost" size="icon">
              <Edit className="h-5 w-5" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="primary" className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none">
              <TabsTrigger 
                value="primary" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4"
              >
                Primary
              </TabsTrigger>
              <TabsTrigger 
                value="general" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4"
              >
                General
              </TabsTrigger>
              <TabsTrigger 
                value="channels" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4"
              >
                Channels
              </TabsTrigger>
              <TabsTrigger 
                value="requests" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4"
              >
                Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="primary" className="mt-0 flex-1">
              <ConversationsList
                userId={user.id}
                userType={isAgent ? "agent" : "customer"}
                selectedConversationId={selectedConversationId}
                onSelectConversation={setSelectedConversationId}
              />
            </TabsContent>
            
            <TabsContent value="general" className="mt-0">
              <ConversationsList
                userId={user.id}
                userType={isAgent ? "agent" : "customer"}
                selectedConversationId={selectedConversationId}
                onSelectConversation={setSelectedConversationId}
              />
            </TabsContent>
            
            <TabsContent value="channels" className="mt-0">
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No channels yet</p>
              </div>
            </TabsContent>
            
            <TabsContent value="requests" className="mt-0">
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No message requests</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <MessageThread
            conversationId={selectedConversationId}
            userId={user.id}
            userType={isAgent ? "agent" : "customer"}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-2 border-foreground mb-4">
                <MessageCircle className="h-12 w-12" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Your messages</h2>
              <p className="text-muted-foreground mb-6">Send a message to start a chat.</p>
              <Button>Send message</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
