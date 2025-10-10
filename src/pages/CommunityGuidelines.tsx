import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Guideline {
  id: string;
  title: string;
  content: string;
  category: string;
  order_index: number;
}

export default function CommunityGuidelines() {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuidelines();
  }, []);

  const loadGuidelines = async () => {
    try {
      const { data, error } = await supabase
        .from("community_guidelines")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (error) throw error;
      setGuidelines(data || []);
    } catch (error) {
      console.error("Error loading guidelines:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-4xl">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-full mb-8" />
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="mb-4">
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Shield className="h-8 w-8" />
          Community Guidelines
        </h1>
        <p className="text-muted-foreground">
          Our guidelines help keep our community safe, welcoming, and authentic.
        </p>
      </div>

      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Violations May Result In:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Content removal</li>
                <li>• Temporary or permanent account restrictions</li>
                <li>• Loss of monetization privileges</li>
                <li>• Account suspension or termination</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {guidelines.map((guideline) => (
          <Card key={guideline.id}>
            <CardHeader>
              <CardTitle className="text-xl">{guideline.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {guideline.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Reporting Violations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            If you see content that violates these guidelines, please report it using
            the report button. Our moderation team reviews all reports and takes
            appropriate action. False reports may result in restrictions on your account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
