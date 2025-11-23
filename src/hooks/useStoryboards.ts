import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Storyboard = {
  id: string;
  trip_id: string | null;
  owner_id: string;
  owner_role: "creator" | "agent" | "traveler";
  title: string | null;
  description: string | null;
  theme_tags: string[] | null;
  visibility: "private" | "trip" | "public_template";
  created_at: string;
  updated_at: string;
};

type StoryboardItem = {
  id: string;
  storyboard_id: string;
  order_index: number;
  layout_type: "masonry" | "full" | "half" | "third";
  media_url: string | null;
  media_attribution: string | null;
  caption: string | null;
  location_label: string | null;
  day_number: number | null;
  time_of_day: string | null;
  category_tag: string | null;
  kind: string | null;
  source: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
};

export function useStoryboards(tripId?: string, ownerId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: storyboards, isLoading } = useQuery({
    queryKey: ["storyboards", tripId, ownerId],
    queryFn: async () => {
      let query = supabase.from("storyboards").select("*");
      
      if (tripId) {
        query = query.eq("trip_id", tripId);
      }
      if (ownerId) {
        query = query.eq("owner_id", ownerId);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Storyboard[];
    },
    enabled: !!(tripId || ownerId),
  });

  const createStoryboard = useMutation({
    mutationFn: async (input: {
      trip_id?: string;
      owner_role: "creator" | "agent" | "traveler";
      title: string;
      description?: string;
      theme_tags?: string[];
      visibility?: "private" | "trip" | "public_template";
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("storyboards")
        .insert({
          ...input,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Storyboard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storyboards"] });
      toast({
        title: "Storyboard created",
        description: "Your storyboard has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    storyboards,
    isLoading,
    createStoryboard: createStoryboard.mutate,
  };
}

export function useStoryboardItems(storyboardId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["storyboard-items", storyboardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storyboard_items")
        .select("*")
        .eq("storyboard_id", storyboardId!)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as StoryboardItem[];
    },
    enabled: !!storyboardId,
  });

  const addItem = useMutation({
    mutationFn: async (input: {
      storyboard_id: string;
      media_url: string;
      caption?: string;
      location_label?: string;
      day_number?: number;
      time_of_day?: string;
      category_tag?: string;
      layout_type?: "masonry" | "full" | "half" | "third";
    }) => {
      const { data, error } = await supabase
        .from("storyboard_items")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as StoryboardItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storyboard-items"] });
      toast({
        title: "Item added",
        description: "Item added to storyboard successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("storyboard_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storyboard-items"] });
      toast({
        title: "Item removed",
        description: "Item removed from storyboard.",
      });
    },
  });

  return {
    items,
    isLoading,
    addItem: addItem.mutate,
    deleteItem: deleteItem.mutate,
  };
}
