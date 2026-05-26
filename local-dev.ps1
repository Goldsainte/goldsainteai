param(
    [switch]$Reset
)

$ErrorActionPreference = "Stop"

function Write-Header([string]$msg) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

# Step 1: Ensure Docker is running
Write-Header "Step 1/4 - Docker Desktop"

# Use SilentlyContinue locally - docker info writes warnings to stderr which
# triggers Stop on some Windows Docker Desktop setups.
$dockerInfo = & { $ErrorActionPreference = "SilentlyContinue"; docker info 2>&1 | Out-String }
$dockerOk = $dockerInfo -match "Server:"

if (-not $dockerOk) {
    Write-Host "Docker Desktop does not appear to be running. Attempting to start it..." -ForegroundColor Yellow
    $dockerExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerExe) {
        Start-Process $dockerExe
        Write-Host "Waiting for Docker engine (up to 90s)..." -ForegroundColor Yellow
        $waited = 0
        while ($waited -lt 90) {
            Start-Sleep -Seconds 5
            $waited += 5
            $info = & { $ErrorActionPreference = "SilentlyContinue"; docker info 2>&1 | Out-String }
            if ($info -match "Server:") { $dockerOk = $true; break }
        }
    }
    if (-not $dockerOk) {
        Write-Host "ERROR: Could not reach Docker engine." -ForegroundColor Red
        Write-Host "Please start Docker Desktop manually, wait for it to fully load, then re-run this script." -ForegroundColor Red
        exit 1
    }
}
Write-Host "Docker is running." -ForegroundColor Green

# Step 2: Start local Supabase
Write-Header "Step 2/4 - supabase start"
Write-Host "Starting local Supabase stack (Postgres, Auth, Storage, Studio)..." -ForegroundColor Yellow
Write-Host "This pulls Docker images on first run - may take a few minutes." -ForegroundColor DarkYellow

supabase start
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: supabase start returned exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "Local Supabase started." -ForegroundColor Green

# Step 3: Apply migrations
Write-Header "Step 3/4 - Database migrations"

if ($Reset) {
    Write-Host "Resetting local DB (applies all migrations fresh)..." -ForegroundColor Yellow
    supabase db reset
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: supabase db reset returned exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "DB reset complete." -ForegroundColor Green
} else {
    Write-Host "Applying any pending migrations to local DB..." -ForegroundColor Yellow
    echo "y" | supabase db push --local
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: db push had issues - run with -Reset for a clean slate." -ForegroundColor Yellow
    } else {
        Write-Host "Migrations up to date." -ForegroundColor Green
    }
}

# Step 4: Print next steps
Write-Header "Step 4/4 - Start dev servers"

Write-Host ""
Write-Host "Open TWO more terminals and run one command in each:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Terminal A - Edge Functions:" -ForegroundColor Cyan
Write-Host "    supabase functions serve --env-file .env.local" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal B - Frontend:" -ForegroundColor Cyan
Write-Host "    npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Local URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:        http://localhost:5173" -ForegroundColor White
Write-Host "  Supabase API:    http://localhost:54321" -ForegroundColor White
Write-Host "  Supabase Studio: http://localhost:54323  (DB admin UI)" -ForegroundColor White
Write-Host "  Inbucket email:  http://localhost:54324  (catches all local emails)" -ForegroundColor White
Write-Host ""
Write-Host "When happy with local changes, deploy to production:" -ForegroundColor Yellow
Write-Host "  .\deploy.ps1" -ForegroundColor White
Write-Host ""

