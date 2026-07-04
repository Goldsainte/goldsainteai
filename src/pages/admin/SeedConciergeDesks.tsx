import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function SeedConciergeDesks() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("smooth-service");
      if (error) throw error;
      setResult(data);
      toast.success(data?.message || "Done");
    } catch (err: any) {
      toast.error(err?.message || "Failed to run");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-secondary text-2xl text-[#0a2225] mb-2">
        Create Goldsainte Concierge Desks
      </h1>
      <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
        Creates 10 regional Goldsainte Concierge creator profiles — each honestly labeled as
        "Run by the Goldsainte team" in its own bio, with a real destination photo (not a
        fabricated face) and no invented follower or engagement numbers. Every account's login
        email is a plus-addressed variant of a.powell@cornellfacilities.com, so traveler messages
        route to that inbox automatically. Safe to click more than once — desks that already
        exist are skipped, never duplicated.
      </p>

      <Button
        onClick={handleRun}
        disabled={loading}
        className="bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full px-6"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating desks…
          </>
        ) : (
          "Create the 10 Concierge Desks"
        )}
      </Button>

      {result && (
        <div className="mt-6 rounded-2xl border border-[#E5DFC6] bg-white p-5 text-sm">
          <div className="flex items-center gap-2 mb-3 text-[#0c4d47] font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            {result.message}
          </div>
          <ul className="space-y-1.5">
            {result.results?.map((r: any, i: number) => (
              <li key={i} className="text-[#0a2225]/70">
                {r.skipped ? (
                  <>⏭ {r.region} — already exists, skipped</>
                ) : (
                  <>✅ {r.region} — {r.email}</>
                )}
              </li>
            ))}
          </ul>
          {result.errors?.length > 0 && (
            <div className="mt-3 text-red-600">
              {result.errors.length} error(s) — check Supabase function logs for detail.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
