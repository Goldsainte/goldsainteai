import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/backendConfig";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);