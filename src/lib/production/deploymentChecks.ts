/**
 * Pre-deployment validation checks
 */

import { validateEnvironment, validateEndpoints, validateBrowserSupport } from "./environmentValidator";
import { generatePerformanceReport } from "./performanceBenchmark";

export interface DeploymentCheckResult {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: string[];
}

export interface DeploymentReport {
  timestamp: string;
  environment: string;
  checks: DeploymentCheckResult[];
  overallStatus: "ready" | "not-ready" | "review-needed";
  blockers: string[];
  warnings: string[];
}

/**
 * Run pre-deployment security checks
 */
async function runSecurityChecks(): Promise<DeploymentCheckResult[]> {
  const checks: DeploymentCheckResult[] = [];

  // Check HTTPS
  checks.push({
    name: "HTTPS Enforcement",
    status: window.location.protocol === "https:" ? "pass" : "fail",
    message: window.location.protocol === "https:" 
      ? "Site is using HTTPS" 
      : "Site must use HTTPS in production",
  });

  // Check secure context
  checks.push({
    name: "Secure Context",
    status: window.isSecureContext ? "pass" : "fail",
    message: window.isSecureContext 
      ? "Running in secure context" 
      : "Must run in secure context (HTTPS)",
  });

  // Check Content Security Policy
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  checks.push({
    name: "Content Security Policy",
    status: cspMeta ? "pass" : "warning",
    message: cspMeta 
      ? "CSP headers configured" 
      : "Consider adding CSP headers for additional security",
  });

  return checks;
}

/**
 * Run environment validation checks
 */
async function runEnvironmentChecks(): Promise<DeploymentCheckResult[]> {
  const envResult = await validateEnvironment();
  const endpointResult = await validateEndpoints();
  const browserResult = validateBrowserSupport();

  const checks: DeploymentCheckResult[] = [];

  checks.push({
    name: "Environment Variables",
    status: envResult.valid ? "pass" : "fail",
    message: envResult.valid 
      ? "All required environment variables configured" 
      : "Missing required environment variables",
    details: [...envResult.errors, ...envResult.warnings],
  });

  checks.push({
    name: "API Endpoints",
    status: endpointResult.valid ? "pass" : "fail",
    message: endpointResult.valid 
      ? "All API endpoints accessible" 
      : "Some API endpoints unreachable",
    details: [...endpointResult.errors, ...endpointResult.warnings],
  });

  checks.push({
    name: "Browser Compatibility",
    status: browserResult.valid ? "pass" : browserResult.warnings.length > 0 ? "warning" : "fail",
    message: browserResult.valid 
      ? "All required browser APIs available" 
      : "Some browser APIs unavailable",
    details: [...browserResult.errors, ...browserResult.warnings],
  });

  return checks;
}

/**
 * Run performance checks
 */
async function runPerformanceChecks(): Promise<DeploymentCheckResult[]> {
  const checks: DeploymentCheckResult[] = [];

  try {
    const report = await generatePerformanceReport();
    
    checks.push({
      name: "Core Web Vitals",
      status: report.overallScore >= 90 ? "pass" : report.overallScore >= 70 ? "warning" : "fail",
      message: `Overall performance score: ${report.overallScore}`,
      details: report.recommendations,
    });

    // Check LCP
    if (report.metrics.lcp) {
      checks.push({
        name: "Largest Contentful Paint (LCP)",
        status: report.scores.lcp.rating === "good" ? "pass" : report.scores.lcp.rating === "needs-improvement" ? "warning" : "fail",
        message: `LCP: ${Math.round(report.metrics.lcp)}ms (target: <2500ms)`,
      });
    }

    // Check CLS
    if (report.metrics.cls !== undefined) {
      checks.push({
        name: "Cumulative Layout Shift (CLS)",
        status: report.scores.cls.rating === "good" ? "pass" : report.scores.cls.rating === "needs-improvement" ? "warning" : "fail",
        message: `CLS: ${report.metrics.cls.toFixed(3)} (target: <0.1)`,
      });
    }
  } catch (error) {
    checks.push({
      name: "Performance Metrics",
      status: "warning",
      message: "Could not measure performance metrics",
      details: [error instanceof Error ? error.message : "Unknown error"],
    });
  }

  return checks;
}

/**
 * Run database checks
 */
async function runDatabaseChecks(): Promise<DeploymentCheckResult[]> {
  const checks: DeploymentCheckResult[] = [];

  // This would typically check RLS policies, indexes, etc.
  checks.push({
    name: "Database Configuration",
    status: "warning",
    message: "Manual verification required for RLS policies and indexes",
  });

  return checks;
}

/**
 * Generate complete deployment report
 */
export async function generateDeploymentReport(): Promise<DeploymentReport> {
  const [securityChecks, environmentChecks, performanceChecks, databaseChecks] = await Promise.all([
    runSecurityChecks(),
    runEnvironmentChecks(),
    runPerformanceChecks(),
    runDatabaseChecks(),
  ]);

  const checks = [
    ...securityChecks,
    ...environmentChecks,
    ...performanceChecks,
    ...databaseChecks,
  ];

  const blockers = checks
    .filter((check) => check.status === "fail")
    .map((check) => check.message);

  const warnings = checks
    .filter((check) => check.status === "warning")
    .map((check) => check.message);

  const overallStatus: DeploymentReport["overallStatus"] = 
    blockers.length > 0 ? "not-ready" : 
    warnings.length > 0 ? "review-needed" : 
    "ready";

  return {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.PROD ? "production" : "development",
    checks,
    overallStatus,
    blockers,
    warnings,
  };
}

/**
 * Console-friendly deployment report
 */
export function logDeploymentReport(report: DeploymentReport): void {
  console.group("🚀 Deployment Readiness Report");
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Environment: ${report.environment}`);
  console.log(`Status: ${report.overallStatus.toUpperCase()}`);
  
  if (report.blockers.length > 0) {
    console.group("❌ Blockers:");
    report.blockers.forEach((blocker) => console.error(`  • ${blocker}`));
    console.groupEnd();
  }

  if (report.warnings.length > 0) {
    console.group("⚠️ Warnings:");
    report.warnings.forEach((warning) => console.warn(`  • ${warning}`));
    console.groupEnd();
  }

  console.group("📋 All Checks:");
  report.checks.forEach((check) => {
    const icon = check.status === "pass" ? "✅" : check.status === "warning" ? "⚠️" : "❌";
    console.log(`${icon} ${check.name}: ${check.message}`);
    if (check.details && check.details.length > 0) {
      check.details.forEach((detail) => console.log(`    - ${detail}`));
    }
  });
  console.groupEnd();

  console.groupEnd();
}
