import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  status: "complete" | "incomplete" | "warning";
  priority: "P0" | "P1" | "P2";
  autoCheck?: () => Promise<boolean>;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Security & Compliance
  {
    id: "sec-1",
    category: "Security",
    item: "All secrets in secure vault",
    status: "incomplete",
    priority: "P0",
  },
  {
    id: "sec-2",
    category: "Security",
    item: "HTTPS enforced on all endpoints",
    status: "incomplete",
    priority: "P0",
  },
  {
    id: "sec-3",
    category: "Security",
    item: "RLS policies enabled on all tables",
    status: "incomplete",
    priority: "P0",
  },
  {
    id: "sec-4",
    category: "Security",
    item: "Rate limiting configured",
    status: "incomplete",
    priority: "P0",
  },
  {
    id: "sec-5",
    category: "Security",
    item: "CSRF tokens implemented",
    status: "incomplete",
    priority: "P1",
  },

  // Performance
  {
    id: "perf-1",
    category: "Performance",
    item: "Lighthouse score ≥90",
    status: "incomplete",
    priority: "P0",
  },
  {
    id: "perf-2",
    category: "Performance",
    item: "Core Web Vitals passing",
    status: "incomplete",
    priority: "P0",
  },
  {
    id: "perf-3",
    category: "Performance",
    item: "Image optimization completed",
    status: "incomplete",
    priority: "P1",
  },
  {
    id: "perf-4",
    category: "Performance",
    item: "Code splitting implemented",
    status: "incomplete",
    priority: "P1",
  },

  // Monitoring
  {
    id: "mon-1",
    category: "Monitoring",
    item: "Error tracking configured",
    status: "incomplete",
    priority: "P0",
  },
  {
    id: "mon-2",
    category: "Monitoring",
    item: "Performance monitoring active",
    status: "incomplete",
    priority: "P0",
  },
  {
    id: "mon-3",
    category: "Monitoring",
    item: "Uptime monitoring configured",
    status: "incomplete",
    priority: "P0",
  },
  {
    id: "mon-4",
    category: "Monitoring",
    item: "Alert thresholds defined",
    status: "incomplete",
    priority: "P1",
  },

  // Features
  {
    id: "feat-1",
    category: "Features",
    item: "Voice wake word functional",
    status: "incomplete",
    priority: "P0",
  },
  {
    id: "feat-2",
    category: "Features",
    item: "AI chat booking flow validated",
    status: "incomplete",
    priority: "P0",
  },
  {
    id: "feat-3",
    category: "Features",
    item: "Payment processing verified",
    status: "incomplete",
    priority: "P0",
  },
  {
    id: "feat-4",
    category: "Features",
    item: "Email notifications working",
    status: "incomplete",
    priority: "P0",
  },

  // Documentation
  {
    id: "doc-1",
    category: "Documentation",
    item: "User guide published",
    status: "incomplete",
    priority: "P1",
  },
  {
    id: "doc-2",
    category: "Documentation",
    item: "API documentation complete",
    status: "incomplete",
    priority: "P1",
  },
  {
    id: "doc-3",
    category: "Documentation",
    item: "Privacy policy published",
    status: "incomplete",
    priority: "P0",
  },
  {
    id: "doc-4",
    category: "Documentation",
    item: "Terms of service published",
    status: "incomplete",
    priority: "P0",
  },
];

export function ProductionChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(CHECKLIST_ITEMS);
  const [checking, setChecking] = useState(false);

  const categories = Array.from(new Set(items.map((item) => item.category)));

  const getStatusIcon = (status: ChecklistItem["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: ChecklistItem["priority"]) => {
    switch (priority) {
      case "P0":
        return "destructive";
      case "P1":
        return "default";
      case "P2":
        return "secondary";
    }
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "complete" ? "incomplete" : "complete",
            }
          : item
      )
    );
  };

  const runAutoChecks = async () => {
    setChecking(true);
    const updatedItems = [...items];

    for (const item of updatedItems) {
      if (item.autoCheck) {
        try {
          const result = await item.autoCheck();
          item.status = result ? "complete" : "incomplete";
        } catch (error) {
          console.error(`Auto-check failed for ${item.id}:`, error);
          item.status = "warning";
        }
      }
    }

    setItems(updatedItems);
    setChecking(false);
    toast.success("Auto-checks completed");
  };

  const totalItems = items.length;
  const completedItems = items.filter((item) => item.status === "complete").length;
  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  const p0Items = items.filter((item) => item.priority === "P0");
  const p0Complete = p0Items.filter((item) => item.status === "complete").length;
  const p0Percentage = Math.round((p0Complete / p0Items.length) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Production Launch Checklist</CardTitle>
          <CardDescription>
            Track readiness across security, performance, monitoring, features, and documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedItems} / {totalItems}
                </span>
              </div>
              <Progress value={completionPercentage} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">P0 Blockers</span>
                <span className="text-sm text-muted-foreground">
                  {p0Complete} / {p0Items.length}
                </span>
              </div>
              <Progress value={p0Percentage} className="[&>div]:bg-red-600" />
            </div>
          </div>

          <Button onClick={runAutoChecks} disabled={checking} className="w-full">
            {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Auto-Checks
          </Button>
        </CardContent>
      </Card>

      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items
                .filter((item) => item.category === category)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <span className="text-sm">{item.item}</span>
                    </div>
                    <Badge variant={getPriorityColor(item.priority)}>{item.priority}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
