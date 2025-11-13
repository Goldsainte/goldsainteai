import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SecurityCheck {
  id: string;
  name: string;
  category: "rls" | "cors" | "auth" | "data" | "webhook";
  severity: "critical" | "high" | "medium";
  description: string;
  status: "pass" | "fail" | "unknown";
  recommendation?: string;
}

const SECURITY_CHECKS: SecurityCheck[] = [
  {
    id: "rls_enabled",
    name: "RLS Enabled on All Tables",
    category: "rls",
    severity: "critical",
    description: "Row Level Security must be enabled on all public tables",
    status: "unknown",
    recommendation: "Run Supabase linter to verify RLS policies"
  },
  {
    id: "rls_policies",
    name: "RLS Policies Configured",
    category: "rls",
    severity: "critical",
    description: "All tables must have appropriate SELECT, INSERT, UPDATE, DELETE policies",
    status: "unknown",
    recommendation: "Use supabase--linter tool to audit policies"
  },
  {
    id: "cors_configured",
    name: "CORS Headers on Edge Functions",
    category: "cors",
    severity: "high",
    description: "All edge functions must include proper CORS headers with POST, OPTIONS",
    status: "unknown",
    recommendation: "Review edge functions for corsHeaders with Access-Control-Allow-Methods"
  },
  {
    id: "webhook_verification",
    name: "Stripe Webhook Signature Verification",
    category: "webhook",
    severity: "critical",
    description: "stripe-webhook must verify signatures to prevent unauthorized requests",
    status: "unknown",
    recommendation: "Verify webhookSecurity.ts is imported and used"
  },
  {
    id: "no_select_star",
    name: "No select('*') on PII Tables",
    category: "data",
    severity: "high",
    description: "Client code should not use select('*') on profiles, user_subscriptions, etc.",
    status: "unknown",
    recommendation: "Audit codebase for .select('*') usage, replace with specific columns"
  },
  {
    id: "service_role_usage",
    name: "SERVICE_ROLE_KEY Used Appropriately",
    category: "auth",
    severity: "critical",
    description: "SERVICE_ROLE_KEY should only be used in edge functions when admin privileges needed",
    status: "unknown",
    recommendation: "Never expose SERVICE_ROLE_KEY to client code"
  },
  {
    id: "auth_token_validation",
    name: "User ID Derived from Auth Token",
    category: "auth",
    severity: "critical",
    description: "Never trust client-passed user_id, always derive from supabase.auth.getUser()",
    status: "unknown",
    recommendation: "Review edge functions for proper auth token validation"
  },
  {
    id: "idempotency_keys",
    name: "Stripe Idempotency Keys",
    category: "webhook",
    severity: "high",
    description: "Payment endpoints should use idempotency keys to prevent double-charges",
    status: "pass",
    recommendation: "Implemented in Phase 5 with idempotency.ts helper"
  },
  {
    id: "rate_limiting",
    name: "Rate Limiting on Edge Functions",
    category: "auth",
    severity: "medium",
    description: "Edge functions should implement rate limiting to prevent abuse",
    status: "pass",
    recommendation: "Implemented in subscription edge functions (5 req/min)"
  },
  {
    id: "xss_prevention",
    name: "XSS Prevention",
    category: "data",
    severity: "high",
    description: "No dangerouslySetInnerHTML except with DOMPurify sanitization",
    status: "pass",
    recommendation: "ArticleBody.tsx uses URL-based embed validation"
  }
];

export function SecurityAudit() {
  const [expanded, setExpanded] = useState(false);

  const criticalIssues = SECURITY_CHECKS.filter(c => c.severity === "critical" && c.status !== "pass");
  const highIssues = SECURITY_CHECKS.filter(c => c.severity === "high" && c.status !== "pass");
  const passedChecks = SECURITY_CHECKS.filter(c => c.status === "pass");

  const categoryGroups = {
    rls: SECURITY_CHECKS.filter(c => c.category === "rls"),
    auth: SECURITY_CHECKS.filter(c => c.category === "auth"),
    cors: SECURITY_CHECKS.filter(c => c.category === "cors"),
    webhook: SECURITY_CHECKS.filter(c => c.category === "webhook"),
    data: SECURITY_CHECKS.filter(c => c.category === "data"),
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "outline";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "fail": return <XCircle className="h-4 w-4 text-destructive" />;
      case "unknown": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Security Audit</h2>
            <p className="text-sm text-muted-foreground">Production security checklist</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="default">{passedChecks.length} Passing</Badge>
          {criticalIssues.length > 0 && (
            <Badge variant="destructive">{criticalIssues.length} Critical</Badge>
          )}
          {highIssues.length > 0 && (
            <Badge variant="outline">{highIssues.length} High</Badge>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-500">{passedChecks.length}</div>
          <div className="text-sm text-muted-foreground">Checks Passing</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-destructive">{criticalIssues.length}</div>
          <div className="text-sm text-muted-foreground">Critical Issues</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-500">{highIssues.length}</div>
          <div className="text-sm text-muted-foreground">High Priority</div>
        </Card>
      </div>

      {/* Detailed Checks */}
      <div className="space-y-6">
        {Object.entries(categoryGroups).map(([category, checks]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">
              {category === "rls" ? "Row Level Security" : 
               category === "auth" ? "Authentication & Authorization" :
               category === "cors" ? "CORS Configuration" :
               category === "webhook" ? "Webhook Security" :
               "Data Protection"}
            </h3>
            <div className="space-y-3">
              {checks.map((check) => (
                <Card key={check.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(check.status)}
                      <span className="font-medium">{check.name}</span>
                    </div>
                    <Badge variant={getSeverityColor(check.severity)}>
                      {check.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{check.description}</p>
                  {check.recommendation && (
                    <p className="text-xs text-primary">💡 {check.recommendation}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div className="mt-6 pt-6 border-t">
        <Button 
          onClick={() => window.open('https://docs.lovable.dev/features/security', '_blank')}
          variant="outline"
          className="w-full"
        >
          View Security Documentation
        </Button>
      </div>
    </Card>
  );
}
