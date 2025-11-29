// Clean Supabase client configuration without placeholder fallbacks.
// This version ensures previews and production builds only work
// when proper environment variables are provided.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Read Supabase environment variables (required)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate configuration
const isInvalidConfig =
  !SUPABASE_URL ||
  !SUPABASE_PUBLISHABLE_KEY ||
  SUPABASE_URL.includes("placeholder.supabase.co") ||
  SUPABASE_URL.includes("your-project.supabase.co") ||
  SUPABASE_PUBLISHABLE_KEY.includes("your-supabase-anon-key") ||
  SUPABASE_PUBLISHABLE_KEY === "public-anon-key";

// In production (including Lovable preview), fail fast if missing config
if (import.meta.env.PROD && isInvalidConfig) {
  throw new Error(
    "Supabase is not configured: please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the environment."
  );
}

// In development, warn but don't crash
if (import.meta.env.DEV && isInvalidConfig) {
  console.warn(
    "Warning: Supabase is using invalid or placeholder config. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
  );
}

// Create the Supabase client
export const supabase = createClient<Database>(
  SUPABASE_URL!,
  SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
