import { useEffect, useState } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FORMAT_RE = /^[a-z0-9-]{3,30}$/;

interface Props {
  userId: string;
  initialValue: string | null;
  onSaved?: (username: string) => void;
}

type State = "idle" | "checking" | "available" | "taken" | "invalid" | "saving" | "saved" | "error";

export function UsernameField({ userId, initialValue, onSaved }: Props) {
  const [value, setValue] = useState(initialValue ?? "");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(initialValue ?? "");
  }, [initialValue]);

  // Debounced availability check
  useEffect(() => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || trimmed === (initialValue ?? "").toLowerCase()) {
      setState("idle");
      setError(null);
      return;
    }
    if (!FORMAT_RE.test(trimmed)) {
      setState("invalid");
      setError("3–30 chars, lowercase letters, numbers, dashes only.");
      return;
    }
    setState("checking");
    setError(null);
    const t = setTimeout(async () => {
      const { data, error: qErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", trimmed)
        .neq("id", userId)
        .maybeSingle();
      if (qErr) {
        setState("error");
        setError("Could not check availability.");
        return;
      }
      setState(data ? "taken" : "available");
    }, 400);
    return () => clearTimeout(t);
  }, [value, userId, initialValue]);

  const handleSave = async () => {
    const trimmed = value.trim().toLowerCase();
    if (!FORMAT_RE.test(trimmed)) return;
    if (state !== "available") return;
    setState("saving");
    const { error: uErr } = await supabase
      .from("profiles")
      .update({ username: trimmed })
      .eq("id", userId);
    if (uErr) {
      setState("error");
      setError(uErr.message);
      return;
    }
    setState("saved");
    onSaved?.(trimmed);
    setTimeout(() => setState("idle"), 1500);
  };

  const previewHandle = (value || initialValue || "your-handle").toLowerCase();

  return (
    <div className="space-y-2">
      <Label htmlFor="username" className="text-sm font-medium text-[#0a2225]">
        Username
      </Label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6B7280]">@</span>
          <Input
            id="username"
            value={value}
            onChange={(e) => setValue(e.target.value.toLowerCase())}
            className="pl-7"
            maxLength={30}
            placeholder="your-handle"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {state === "checking" && <Loader2 className="h-4 w-4 animate-spin text-[#6B7280]" />}
            {state === "available" && <Check className="h-4 w-4 text-[#0c4d47]" />}
            {(state === "taken" || state === "invalid" || state === "error") && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={state !== "available"}
          className="rounded-full bg-[#0c4d47] px-5 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-[#0a3d39] transition"
        >
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Save"}
        </button>
      </div>
      <p className="text-xs text-[#6B7280]">
        Your shop link: <span className="font-medium text-[#0a2225]">goldsainte.ai/@{previewHandle}</span>
      </p>
      {state === "taken" && <p className="text-xs text-red-500">That handle is already taken.</p>}
      {error && state !== "available" && state !== "saved" && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}