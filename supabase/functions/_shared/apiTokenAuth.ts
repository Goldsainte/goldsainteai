/**
 * API Token Authentication (for future partner APIs)
 * Uses SHA-256 hashed tokens stored in api_tokens table
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CONFIG } from "./config.ts";

export interface ApiToken {
  id: string;
  owner_user_id: string;
  scopes: string[];
  label?: string;
}

/**
 * Authenticate request using x-api-key header
 * Returns token data if valid, null if invalid/revoked
 */
export async function authenticateApiToken(
  req: Request
): Promise<ApiToken | null> {
  const rawToken = req.headers.get("x-api-key");
  if (!rawToken) return null;

  // Hash the incoming token
  const data = new TextEncoder().encode(rawToken);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Look up token in database
  const supabase = createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: token, error } = await supabase
    .from("api_tokens")
    .select("id, owner_user_id, scopes, label, revoked_at")
    .eq("token_hash", hashHex)
    .maybeSingle();

  if (error || !token || token.revoked_at) {
    return null;
  }

  // Update last_used_at
  await supabase
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", token.id);

  return {
    id: token.id,
    owner_user_id: token.owner_user_id,
    scopes: token.scopes,
    label: token.label,
  };
}

/**
 * Check if token has required scope
 */
export function hasScope(token: ApiToken, requiredScope: string): boolean {
  return token.scopes.includes(requiredScope);
}
