/**
 * Centralized configuration with fail-fast validation
 * Ensures critical environment variables are present at startup
 */

export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  
  // Fail fast in production if required env var is missing
  if (!value && Deno.env.get("DENO_DEPLOYMENT_ID")) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  
  return value ?? "";
}

// Load critical config at module initialization (fails fast on import)
export const CONFIG = {
  // Supabase
  SUPABASE_URL: requireEnv("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  
  // External APIs
  OPENAI_API_KEY: requireEnv("OPENAI_API_KEY"),
  STRIPE_SECRET_KEY: requireEnv("STRIPE_SECRET_KEY"),
  AMADEUS_API_KEY: requireEnv("AMADEUS_API_KEY"),
  AMADEUS_API_SECRET: requireEnv("AMADEUS_API_SECRET"),
  
  // Optional with defaults
  SITE_URL: Deno.env.get("SITE_URL") || "https://goldsainte.ai",
  NODE_ENV: Deno.env.get("NODE_ENV") || "development",
  
  // Other optional keys (accessed via Deno.env.get when needed)
  // VIATOR_API_KEY, UNSPLASH_ACCESS_KEY, etc.
};
