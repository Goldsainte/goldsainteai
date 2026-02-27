import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDestinationSuggestions() {
  return useQuery({
    queryKey: ["destination-suggestions"],
    queryFn: async () => {
      // Fetch distinct destinations from both packaged_trips and trip_requests
      const [tripsRes, requestsRes] = await Promise.all([
        supabase
          .from("packaged_trips")
          .select("destination")
          .eq("status", "published")
          .not("destination", "is", null),
        supabase
          .from("trip_requests")
          .select("destination")
          .eq("status", "open")
          .not("destination", "is", null),
      ]);

      const all = new Set<string>();
      (tripsRes.data || []).forEach((r) => {
        if (r.destination) all.add(r.destination);
      });
      (requestsRes.data || []).forEach((r) => {
        if (r.destination) all.add(r.destination);
      });

      return Array.from(all).sort((a, b) => a.localeCompare(b));
    },
    staleTime: 5 * 60 * 1000, // cache 5 min
  });
}
