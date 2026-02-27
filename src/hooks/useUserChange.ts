import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Clears React Query cache whenever the authenticated user changes,
 * preventing stale data from a previous session appearing momentarily.
 */
export function useUserChange() {
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUserId = session?.user?.id ?? null;
        const previousUserId = previousUserIdRef.current;

        // If user changed (login→logout, logout→login, or switch accounts)
        if (previousUserId !== null && previousUserId !== currentUserId) {
          queryClient.clear();
        }

        previousUserIdRef.current = currentUserId;
      }
    );

    // Seed the initial user id
    supabase.auth.getUser().then(({ data }) => {
      previousUserIdRef.current = data.user?.id ?? null;
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);
}
