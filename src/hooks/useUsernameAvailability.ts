import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isReservedUsername } from "@/lib/reservedUsernames";

export type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "reserved"
  | "invalid"
  | "error";

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;

/**
 * Debounced live username availability check.
 * - Skips network calls until the value matches the format and is not reserved.
 * - Treats `currentUsername` as always-available (so the user can re-save their own).
 */
export function useUsernameAvailability(
  value: string,
  currentUsername?: string | null,
  delayMs = 450,
): { status: UsernameStatus; message: string } {
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const trimmed = (value || "").trim().replace(/^@/, "");

    if (!trimmed) {
      setStatus("idle");
      setMessage("");
      return;
    }
    if (currentUsername && trimmed.toLowerCase() === currentUsername.toLowerCase()) {
      setStatus("idle");
      setMessage("");
      return;
    }
    if (!USERNAME_RE.test(trimmed)) {
      setStatus("invalid");
      setMessage("3–30 characters: letters, numbers, _ or . only");
      return;
    }
    if (isReservedUsername(trimmed)) {
      setStatus("reserved");
      setMessage("This username is reserved");
      return;
    }

    setStatus("checking");
    setMessage("Checking availability…");

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", trimmed)
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          setStatus("error");
          setMessage("Couldn't check availability");
          return;
        }
        if (data) {
          setStatus("taken");
          setMessage("Username is already taken");
        } else {
          setStatus("available");
          setMessage("Available");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Couldn't check availability");
        }
      }
    }, delayMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, currentUsername, delayMs]);

  return { status, message };
}