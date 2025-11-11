import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, Eye, Clock } from "lucide-react";

interface WebVitals {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
}

export function PerformanceMonitor() {
  const [vitals, setVitals] = useState<WebVitals>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  });

  useEffect(() => {
    // Observe performance entries
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "largest-contentful-paint") {
          setVitals((prev) => ({ ...prev, lcp: entry.startTime }));
        }
        if (entry.entryType === "first-input") {
          const fidEntry = entry as PerformanceEventTiming;
          setVitals((prev) => ({ ...prev, fid: fidEntry.processingStart - fidEntry.startTime }));
        }
        if (entry.entryType === "layout-shift" && !(entry as any).hadRecentInput) {
          setVitals((prev) => ({ ...prev, cls: (prev.cls || 0) + (entry as any).value }));
        }
        if (entry.entryType === "paint" && entry.name === "first-contentful-paint") {
          setVitals((prev) => ({ ...prev, fcp: entry.startTime }));
        }
        if (entry.entryType === "navigation") {
          const navEntry = entry as PerformanceNavigationTiming;
          setVitals((prev) => ({ ...prev, ttfb: navEntry.responseStart }));
        }
      }
    });

    // Observe different entry types
    try {
      observer.observe({ entryTypes: ["largest-contentful-paint", "first-input", "layout-shift", "paint", "navigation"] });
    } catch (e) {
      console.warn("Performance observer not fully supported", e);
    }

    return () => observer.disconnect();
  }, []);

  const getScoreColor = (metric: string, value: number | null): string => {
    if (value === null) return "muted";
    
    switch (metric) {
      case "lcp":
        return value <= 2500 ? "default" : value <= 4000 ? "secondary" : "destructive";
      case "fid":
        return value <= 100 ? "default" : value <= 300 ? "secondary" : "destructive";
      case "cls":
        return value <= 0.1 ? "default" : value <= 0.25 ? "secondary" : "destructive";
      case "fcp":
        return value <= 1800 ? "default" : value <= 3000 ? "secondary" : "destructive";
      case "ttfb":
        return value <= 800 ? "default" : value <= 1800 ? "secondary" : "destructive";
      default:
        return "muted";
    }
  };

  const formatMetric = (value: number | null, unit: string = "ms"): string => {
    if (value === null) return "—";
    return unit === "score" ? value.toFixed(3) : `${Math.round(value)}${unit}`;
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">Performance Metrics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>LCP</span>
          </div>
          <Badge variant={getScoreColor("lcp", vitals.lcp)} className="font-mono text-xs">
            {formatMetric(vitals.lcp)}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="w-3 h-3" />
            <span>FID</span>
          </div>
          <Badge variant={getScoreColor("fid", vitals.fid)} className="font-mono text-xs">
            {formatMetric(vitals.fid)}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="w-3 h-3" />
            <span>CLS</span>
          </div>
          <Badge variant={getScoreColor("cls", vitals.cls)} className="font-mono text-xs">
            {formatMetric(vitals.cls, "score")}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>FCP</span>
          </div>
          <Badge variant={getScoreColor("fcp", vitals.fcp)} className="font-mono text-xs">
            {formatMetric(vitals.fcp)}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>TTFB</span>
          </div>
          <Badge variant={getScoreColor("ttfb", vitals.ttfb)} className="font-mono text-xs">
            {formatMetric(vitals.ttfb)}
          </Badge>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground">
          Green: Good • Yellow: Needs Improvement • Red: Poor
        </p>
      </div>
    </Card>
  );
}
