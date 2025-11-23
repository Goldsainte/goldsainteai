import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type StoryboardRow = Database["public"]["Tables"]["storyboards"]["Row"];
type StoryboardItemRow = Database["public"]["Tables"]["storyboard_items"]["Row"];

export type Storyboard = StoryboardRow;
export type StoryboardItem = StoryboardItemRow;

export function useStoryboards(ownerId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: storyboards, isLoading } = useQuery({
    queryKey: ["storyboards", ownerId],
    queryFn: async () => {
      let query = supabase.from("storyboards").select("*");
      
      if (ownerId) {
        query = query.eq("owner_id", ownerId);
      }
      
      const { data, error } = await query.order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data as Storyboard[];
    },
    enabled: !!ownerId,
  });

  const createStoryboard = useMutation({
    mutationFn: async (input: {
      role: "creator" | "traveler";
      title: string;
      description?: string;
      is_public?: boolean;
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
        .order("position", { ascending: true });

      if (error) throw error;
      return data as StoryboardItem[];
    },
    enabled: !!storyboardId,
  });

  const addItem = useMutation({
    mutationFn: async (input: {
      storyboard_id: string;
      item_type: "image" | "creator" | "agent" | "brand" | "note" | "video";
      title?: string;
      subtitle?: string;
      image_url?: string;
      source_type?: string;
      source_id?: string;
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
