import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadMessageCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      const { data, error } = await supabase
        .from("dm_conversations")
        .select("unread_count_p1, unread_count_p2, participant_1, participant_2")
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .neq("status", "declined")
        .neq("status", "blocked");

      if (error) {
        console.error("Error fetching unread count:", error);
        return;
      }

      const total = (data || []).reduce((sum, conv) => {
        const isP1 = conv.participant_1 === user.id;
        return sum + (isP1 ? conv.unread_count_p1 : conv.unread_count_p2) || 0;
      }, 0);

      setUnreadCount(total);
    };

    fetchUnreadCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`unread-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dm_conversations",
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { unreadCount };
}
