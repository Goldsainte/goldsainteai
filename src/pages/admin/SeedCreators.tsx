import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SeedCreators() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSeed = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("seed-creators", {
        body: {},
      });

      if (error) throw error;

      setResult(data);
      toast.success(`Created ${data.created} creators!`);
    } catch (error: any) {
      console.error("Seed error:", error);
      toast.error(error.message || "Failed to seed creators");
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f3ea] p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display">Seed Creator Profiles</h1>
          <p className="text-sm text-neutral-600 mt-2">
            This will create 30 creator profiles with auth users in the database.
          </p>
        </div>

        <Button onClick={handleSeed} disabled={isLoading} size="lg">
          {isLoading ? "Seeding..." : "Seed 30 Creators"}
        </Button>

        {result && (
          <div className="bg-white rounded-xl p-6 border border-[#E5DFC6]">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
