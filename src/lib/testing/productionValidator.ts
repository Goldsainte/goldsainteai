/**
 * Production validation test runner
 * Executes all production readiness checks and generates report
 */

import { generateDeploymentReport, logDeploymentReport, type DeploymentReport } from "../production/deploymentChecks";
import { runAllValidations } from "../production/environmentValidator";
import { generatePerformanceReport } from "../production/performanceBenchmark";

export interface ValidationSuite {
  name: string;
  tests: ValidationTest[];
}

export interface ValidationTest {
  name: string;
  run: () => Promise<boolean>;
  critical: boolean;
}

/**
 * Core validation test suites
 */
export const VALIDATION_SUITES: ValidationSuite[] = [
  {
    name: "Environment & Configuration",
    tests: [
      {
        name: "Environment variables configured",
        run: async () => {
          const result = await runAllValidations();
          return result.environment.valid;
        },
        critical: true,
      },
      {
        name: "API endpoints accessible",
        run: async () => {
          const result = await runAllValidations();
          return result.endpoints.valid;
        },
        critical: true,
      },
      {
        name: "Browser compatibility",
        run: async () => {
          const result = await runAllValidations();
          return result.browser.valid;
        },
        critical: false,
      },
    ],
  },
  {
    name: "Security",
    tests: [
      {
        name: "HTTPS enabled",
        run: async () => window.location.protocol === "https:",
        critical: true,
      },
      {
        name: "Secure context",
        run: async () => window.isSecureContext,
        critical: true,
      },
      {
        name: "CSP headers present",
        run: async () => {
          const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
          return !!cspMeta;
        },
        critical: false,
      },
    ],
  },
  {
    name: "Performance",
    tests: [
      {
        name: "Core Web Vitals passing",
        run: async () => {
          const report = await generatePerformanceReport();
          return report.overallScore >= 70;
        },
        critical: false,
      },
      {
        name: "Performance score ≥90",
        run: async () => {
          const report = await generatePerformanceReport();
          return report.overallScore >= 90;
        },
        critical: false,
      },
    ],
  },
];

/**
 * Run all validation tests
 */
export async function runProductionValidation(): Promise<{
  passed: number;
  failed: number;
  total: number;
  criticalFailures: number;
  report: DeploymentReport;
  suiteResults: Array<{
    suite: string;
    tests: Array<{
      name: string;
      passed: boolean;
      critical: boolean;
    }>;
  }>;
}> {
  console.log("🚀 Starting production validation...");

  let passed = 0;
  let failed = 0;
  let criticalFailures = 0;

  const suiteResults = [];

  for (const suite of VALIDATION_SUITES) {
    console.group(`📋 ${suite.name}`);
    const testResults = [];

    for (const test of suite.tests) {
      try {
        const result = await test.run();
        
        if (result) {
          passed++;
          console.log(`✅ ${test.name}`);
        } else {
          failed++;
          if (test.critical) criticalFailures++;
          console.error(`❌ ${test.name}${test.critical ? " (CRITICAL)" : ""}`);
        }

        testResults.push({
          name: test.name,
          passed: result,
          critical: test.critical,
        });
      } catch (error) {
        failed++;
        if (test.critical) criticalFailures++;
        console.error(`❌ ${test.name} - Error:`, error);
        testResults.push({
          name: test.name,
          passed: false,
          critical: test.critical,
        });
      }
    }

    suiteResults.push({
      suite: suite.name,
      tests: testResults,
    });

    console.groupEnd();
  }

  // Generate comprehensive deployment report
  const report = await generateDeploymentReport();
  logDeploymentReport(report);

  const total = passed + failed;
  console.log("\n📊 Validation Summary:");
  console.log(`   Passed: ${passed}/${total}`);
  console.log(`   Failed: ${failed}/${total}`);
  console.log(`   Critical Failures: ${criticalFailures}`);
  console.log(`   Overall Status: ${report.overallStatus.toUpperCase()}`);

  return {
    passed,
    failed,
    total,
    criticalFailures,
    report,
    suiteResults,
  };
}

/**
 * Check if ready for production deployment
 */
export async function isProductionReady(): Promise<{
  ready: boolean;
  blockers: string[];
  warnings: string[];
}> {
  const validation = await runProductionValidation();

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (validation.criticalFailures > 0) {
    blockers.push(`${validation.criticalFailures} critical test(s) failed`);
  }

  if (validation.report.overallStatus === "not-ready") {
    blockers.push(...validation.report.blockers);
  }

  if (validation.report.overallStatus === "review-needed") {
    warnings.push(...validation.report.warnings);
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
  };
}
