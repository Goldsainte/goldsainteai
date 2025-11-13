import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface EnvCheck {
  name: string;
  key: string;
  required: boolean;
  category: "client" | "sentry" | "integration";
}

const ENV_CHECKS: EnvCheck[] = [
  // Client essentials
  { name: "Supabase URL", key: "VITE_SUPABASE_URL", required: true, category: "client" },
  { name: "Supabase Anon Key", key: "VITE_SUPABASE_PUBLISHABLE_KEY", required: true, category: "client" },
  { name: "Supabase Project ID", key: "VITE_SUPABASE_PROJECT_ID", required: true, category: "client" },
  
  // Sentry monitoring
  { name: "Sentry DSN", key: "VITE_SENTRY_DSN", required: true, category: "sentry" },
  
  // Integrations
  { name: "Mapbox Token", key: "VITE_MAPBOX_PUBLIC_TOKEN", required: false, category: "integration" },
  { name: "Instagram App ID", key: "VITE_INSTAGRAM_APP_ID", required: false, category: "integration" },
  { name: "Google Places API Key", key: "VITE_GOOGLE_PLACES_API_KEY", required: false, category: "integration" },
];

export function EnvironmentValidator() {
  const [results, setResults] = useState<{ check: EnvCheck; status: "pass" | "fail" | "warn" }[]>([]);

  useEffect(() => {
    const checkResults = ENV_CHECKS.map((check) => {
      const value = import.meta.env[check.key];
      const isDefined = !!value && value !== "" && value !== "YOUR_API_KEY_HERE" && !value.includes("PLACEHOLDER");
      
      let status: "pass" | "fail" | "warn";
      if (isDefined) {
        status = "pass";
      } else if (check.required) {
        status = "fail";
      } else {
        status = "warn";
      }

      return { check, status };
    });

    setResults(checkResults);
  }, []);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const failures = results.filter(r => r.status === "fail").length;
  const warnings = results.filter(r => r.status === "warn").length;
  const passes = results.filter(r => r.status === "pass").length;

  const groupedResults = {
    client: results.filter(r => r.check.category === "client"),
    sentry: results.filter(r => r.check.category === "sentry"),
    integration: results.filter(r => r.check.category === "integration"),
  };

  return (
    <Card className="fixed top-4 right-4 p-4 w-96 max-h-[80vh] overflow-auto z-50 bg-background/95 backdrop-blur">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm mb-2">Environment Configuration</h3>
          <div className="flex gap-2">
            <Badge variant={failures > 0 ? "destructive" : "default"}>
              {passes} Configured
            </Badge>
            {failures > 0 && (
              <Badge variant="destructive">{failures} Missing</Badge>
            )}
            {warnings > 0 && (
              <Badge variant="outline">{warnings} Optional</Badge>
            )}
          </div>
        </div>

        {Object.entries(groupedResults).map(([category, items]) => (
          <div key={category}>
            <h4 className="text-xs font-medium uppercase text-muted-foreground mb-2">
              {category === "client" ? "Core Services" : category === "sentry" ? "Monitoring" : "Integrations"}
            </h4>
            <div className="space-y-2">
              {items.map(({ check, status }) => (
                <div key={check.key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{check.name}</span>
                  {status === "pass" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {status === "fail" && <XCircle className="h-4 w-4 text-destructive" />}
                  {status === "warn" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                </div>
              ))}
            </div>
          </div>
        ))}

        {failures > 0 && (
          <div className="text-xs text-destructive border-t pt-2">
            ⚠️ Missing required environment variables. Check project settings.
          </div>
        )}
      </div>
    </Card>
  );
}
