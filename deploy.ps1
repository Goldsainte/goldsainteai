#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy script for goldsainte-ai production Supabase project.

.DESCRIPTION
    Wraps common Supabase deploy commands so you never have to remember --project-ref.

.PARAMETER Action
    What to deploy/run:
      all        - Deploy all edge functions + push DB migrations (default)
      functions  - Deploy all edge functions only
      fn         - Deploy a single edge function (requires -FunctionName)
      db         - Push DB migrations only
      diff       - Preview DB changes (dry run)
      secrets    - Show how to set secrets

.PARAMETER FunctionName
    Name of a single edge function to deploy (used with -Action fn).

.EXAMPLE
    .\deploy.ps1                          # Deploy everything
    .\deploy.ps1 -Action functions        # Edge functions only
    .\deploy.ps1 -Action fn -FunctionName stripe-webhook
    .\deploy.ps1 -Action db               # DB migrations only
    .\deploy.ps1 -Action diff             # Preview DB changes
#>

param(
    [ValidateSet("all", "functions", "fn", "db", "diff", "secrets")]
    [string]$Action = "all",

    [string]$FunctionName = ""
)

$PROJECT_REF = "ktzsgqrqvwtxlimctkaf"
$ErrorActionPreference = "Stop"

function Write-Header([string]$msg) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Assert-SupabaseCLI {
    if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: supabase CLI not found. Install with: npm install -g supabase" -ForegroundColor Red
        exit 1
    }
}

function Assert-Linked {
    $refFile = Join-Path $PSScriptRoot "supabase\.temp\project-ref"
    if (-not (Test-Path $refFile)) {
        Write-Host "ERROR: Project not linked. Run: supabase link --project-ref $PROJECT_REF" -ForegroundColor Red
        exit 1
    }
    $linked = (Get-Content $refFile).Trim()
    if ($linked -ne $PROJECT_REF) {
        Write-Host "WARNING: Linked project ($linked) differs from expected ($PROJECT_REF)." -ForegroundColor Yellow
    }
}

function Deploy-Functions {
    Write-Header "Deploying ALL edge functions -> $PROJECT_REF"
    supabase functions deploy --project-ref $PROJECT_REF
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: Edge function deployment returned exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "All edge functions deployed successfully." -ForegroundColor Green
}

function Deploy-SingleFunction([string]$name) {
    if ([string]::IsNullOrWhiteSpace($name)) {
        Write-Host "ERROR: Provide -FunctionName <name> when using -Action fn" -ForegroundColor Red
        exit 1
    }
    Write-Header "Deploying function '$name' -> $PROJECT_REF"
    supabase functions deploy $name --project-ref $PROJECT_REF
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: Deployment of '$name' returned exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "Function '$name' deployed successfully." -ForegroundColor Green
}

function Push-Migrations {
    Write-Header "Pushing DB migrations -> $PROJECT_REF (linked)"
    supabase db push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: DB push returned exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "DB migrations applied successfully." -ForegroundColor Green
}

function Show-Diff {
    Write-Header "Previewing DB diff (no changes applied)"
    supabase db diff --linked
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: DB diff returned exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

function Show-SecretsHelp {
    Write-Header "How to set secrets"
    Write-Host "Run the following, replacing the placeholder values:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  supabase secrets set --project-ref $PROJECT_REF \" -ForegroundColor White
    Write-Host "    STRIPE_SECRET_KEY=sk_live_xxx \" -ForegroundColor White
    Write-Host "    RESEND_API_KEY=re_xxx \" -ForegroundColor White
    Write-Host "    OPENAI_API_KEY=sk-xxx" -ForegroundColor White
    Write-Host ""
    Write-Host "To list existing secrets (names only, no values):" -ForegroundColor Yellow
    Write-Host "  supabase secrets list --project-ref $PROJECT_REF" -ForegroundColor White
}

#  Main 

Assert-SupabaseCLI
Assert-Linked

switch ($Action) {
    "all" {
        Deploy-Functions
        Push-Migrations
        Write-Host ""
        Write-Host "Full deploy complete." -ForegroundColor Green
    }
    "functions" {
        Deploy-Functions
    }
    "fn" {
        Deploy-SingleFunction $FunctionName
    }
    "db" {
        Push-Migrations
    }
    "diff" {
        Show-Diff
    }
    "secrets" {
        Show-SecretsHelp
    }
}

