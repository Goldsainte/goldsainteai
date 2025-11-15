// src/hooks/useMediaLibrary.ts
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MediaItem = {
  id: string;
  owner_id: string | null;
  source: "system" | "user" | "tiktok" | "external";
  url: string;
  thumb_url: string | null;
  label: string | null;
  tags: string[] | null;
};

export function useMediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const query = supabase
        .from("media_library")
        .select("*")
        .or(
          user?.id
            ? `source.eq.system,owner_id.eq.${user.id}`
            : "source.eq.system",
        )
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (cancelled) return;

      if (error) {
        console.error("Error loading media library", error);
        setItems([]);
      } else {
        setItems((data ?? []) as MediaItem[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading };
}
