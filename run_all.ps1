# ==============================================================================
#  CSx CORE :: MASTER FULL-STACK IGNITION PROTOCOL
#  File: run_all.ps1
#  Usage:
#     .\run_all.ps1            # Launches Backend and Frontend in dedicated console windows
#     .\run_all.ps1 -Headless  # Launches both in background with logs in .logs/
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$Headless,
    [switch]$OpenBrowser,
    [int]$BackendPort = 5000,
    [int]$FrontendPort = 3000
)

$ErrorActionPreference = "Continue"
$RootPath = $PSScriptRoot
if (-not $RootPath) { $RootPath = (Get-Location).Path }

$BackendPath  = Join-Path $RootPath "backend"
$FrontendPath = Join-Path $RootPath "frontend"
$RuntimeFile  = Join-Path $RootPath ".csx_matrix_runtime.json"
$LogsPath     = Join-Path $RootPath ".logs"

# ------------------------------------------------------------------------------
# UI Helpers and Cyber Formatting
# ------------------------------------------------------------------------------
function Print-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ================================================================" -ForegroundColor Cyan
    Write-Host "  |   CSx CORE :: MASTER COMMAND MATRIX FULL-STACK IGNITION     |" -ForegroundColor Cyan
    Write-Host "  ================================================================" -ForegroundColor Cyan
    Write-Host "  | Target Workspace : $RootPath" -ForegroundColor DarkCyan
    Write-Host "  | Local Timestamp  : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkCyan
    Write-Host "  | Execution Mode   : $(if ($Headless) { 'HEADLESS (Background Daemon)' } else { 'WINDOWED (Live Monitored Terminals)' })" -ForegroundColor Yellow
    Write-Host "  ================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Log-Step([string]$step, [string]$msg) {
    Write-Host " [$step] " -ForegroundColor Magenta -NoNewline
    Write-Host $msg -ForegroundColor White
}

function Log-OK([string]$msg) {
    Write-Host "  [+] " -ForegroundColor Green -NoNewline
    Write-Host $msg -ForegroundColor Gray
}

function Log-Warn([string]$msg) {
    Write-Host "  [!] " -ForegroundColor Yellow -NoNewline
    Write-Host $msg -ForegroundColor Yellow
}

function Log-Fatal([string]$msg) {
    Write-Host "  [x] FATAL: " -ForegroundColor Red -NoNewline
    Write-Host $msg -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------------------
# 1. Pre-Flight Checks
# ------------------------------------------------------------------------------
Print-Banner

Log-Step "STAGE 01" "Executing System Architecture Diagnostics..."

try {
    $nodeVer = node -v 2>$null
    if (-not $nodeVer) { Log-Fatal "Node.js runtime not detected in system PATH." }
    Log-OK "Node.js Runtime Detected    : $nodeVer"
} catch {
    Log-Fatal "Node.js check failed."
}

try {
    $npmVer = npm -v 2>$null
    if (-not $npmVer) { Log-Fatal "NPM package manager not detected in system PATH." }
    Log-OK "NPM Package Manager         : v$npmVer"
} catch {
    Log-Fatal "NPM check failed."
}

# Dependencies Check
if (-not (Test-Path (Join-Path $BackendPath "node_modules"))) {
    Log-Warn "Backend node_modules missing. Installing core dependencies..."
    Push-Location $BackendPath
    npm install
    Pop-Location
} else {
    Log-OK "Backend Dependencies        : VERIFIED (node_modules active)"
}

if (-not (Test-Path (Join-Path $FrontendPath "node_modules"))) {
    Log-Warn "Frontend node_modules missing. Installing client dependencies..."
    Push-Location $FrontendPath
    npm install
    Pop-Location
} else {
    Log-OK "Frontend Dependencies       : VERIFIED (node_modules active)"
}

# ------------------------------------------------------------------------------
# 2. Environment Alignment
# ------------------------------------------------------------------------------
Log-Step "STAGE 02" "Synchronizing Environment Parameters..."

$BackendEnv  = Join-Path $BackendPath ".env"
$FrontendEnv = Join-Path $FrontendPath ".env.local"

if (-not (Test-Path $BackendEnv)) {
    $BackendExample = Join-Path $BackendPath ".env.example"
    if (Test-Path $BackendExample) {
        Copy-Item $BackendExample $BackendEnv
        Log-Warn "Created backend/.env from .env.example (Review credentials if connecting to Supabase)."
    } else {
        Log-Warn "backend/.env is missing."
    }
} else {
    Log-OK "Backend Environment         : ACTIVE (backend/.env mounted)"
}

if (-not (Test-Path $FrontendEnv)) {
    $FrontendExample = Join-Path $FrontendPath ".env.example"
    if (Test-Path $FrontendExample) {
        Copy-Item $FrontendExample $FrontendEnv
        Log-OK "Created frontend/.env.local (Defaulted NEXT_PUBLIC_API_URL=http://localhost:$BackendPort)"
    } else {
        "NEXT_PUBLIC_API_URL=http://localhost:$BackendPort" | Out-File -Encoding utf8 $FrontendEnv
        Log-OK "Generated frontend/.env.local with local API routing."
    }
} else {
    Log-OK "Frontend Environment        : ACTIVE (frontend/.env.local mounted)"
}

# ------------------------------------------------------------------------------
# Quick Database Telemetry Probe & Auto-Initialization
# ------------------------------------------------------------------------------
$localDb = Join-Path $BackendPath "dev.db"
if (-not (Test-Path $localDb)) {
    Log-Warn "Local database dev.db not detected. Provisioning local schema..."
    Push-Location $BackendPath
    npx prisma db push --skip-generate | Out-Null
    npm run seed | Out-Null
    npm run seed:admin | Out-Null
    Pop-Location
    Log-OK "Local SQLite data core and master admin account successfully initialized."
}

$dbCheckScript = Join-Path $BackendPath "check-db.ts"
if (Test-Path $dbCheckScript) {
    try {
        Push-Location $BackendPath
        $dbCheckOut = node -r ts-node/register/transpile-only check-db.ts 2>&1
        Pop-Location
        $dbText = $dbCheckOut -join " "
        if ($LASTEXITCODE -eq 0) {
            Log-OK "Database Connectivity       : ONLINE (Local SQLite dev.db)"
        } else {
            Log-Warn "Database Connectivity       : OFFLINE ($dbText)"
        }
    } catch {
        Pop-Location
    }
}

# ------------------------------------------------------------------------------
# 3. Port Conflict Detection and Auto-Resolution
# ------------------------------------------------------------------------------
Log-Step "STAGE 03" "Scanning Network Ports for Conflicting Daemons..."

function Clear-Port([int]$port, [string]$label) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            Log-Warn "$label Port $port is already occupied by PID $p. Terminating stale process..."
            taskkill.exe /PID $p /T /F 2>$null | Out-Null
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Milliseconds 600
        Log-OK "$label Port $port successfully freed and sanitized."
    } else {
        Log-OK "$label Port $port is clear and available."
    }
}

Clear-Port -port $BackendPort -label "Backend Gateway"
Clear-Port -port $FrontendPort -label "Frontend Client "

# ------------------------------------------------------------------------------
# 4. Process Ignition
# ------------------------------------------------------------------------------
Log-Step "STAGE 04" "Igniting Full-Stack Application Matrix..."

if ($Headless) {
    if (-not (Test-Path $LogsPath)) { New-Item -ItemType Directory -Path $LogsPath -Force | Out-Null }
    $BackendLogOut  = Join-Path $LogsPath "backend.stdout.log"
    $BackendLogErr  = Join-Path $LogsPath "backend.stderr.log"
    $FrontendLogOut = Join-Path $LogsPath "frontend.stdout.log"
    $FrontendLogErr = Join-Path $LogsPath "frontend.stderr.log"

    # Start Backend Headless (Detached Hidden Process)
    $backendProcess = Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoProfile", "-WindowStyle", "Hidden", "-Command", "npm run dev 1> `"$BackendLogOut`" 2> `"$BackendLogErr`"" `
        -WorkingDirectory $BackendPath -PassThru -WindowStyle Hidden

    # Start Frontend Headless (Detached Hidden Process)
    $frontendProcess = Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoProfile", "-WindowStyle", "Hidden", "-Command", "npm run dev 1> `"$FrontendLogOut`" 2> `"$FrontendLogErr`"" `
        -WorkingDirectory $FrontendPath -PassThru -WindowStyle Hidden

    Log-OK "Backend Engine Spawned (Headless) : PID $($backendProcess.Id) -> Logging to .logs/backend.stdout.log"
    Log-OK "Frontend Matrix Spawned (Headless): PID $($frontendProcess.Id) -> Logging to .logs/frontend.stdout.log"

    $runtimeData = @{
        mode         = "Headless"
        startedAt    = (Get-Date).ToString("o")
        backendPid   = $backendProcess.Id
        frontendPid  = $frontendProcess.Id
        backendPort  = $BackendPort
        frontendPort = $FrontendPort
    } | ConvertTo-Json
    $runtimeData | Out-File -Encoding utf8 -FilePath $RuntimeFile
} else {
    # Start Backend in Dedicated Labeled Terminal
    $backendCmd = "`$host.UI.RawUI.WindowTitle = '[CSx CORE] Backend Logic Engine :: Port $BackendPort'; Write-Host '[+] [CSx CORE] BACKEND LOGIC ENGINE ONLINE' -ForegroundColor Cyan; npm run dev"
    $backendProcess = Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoExit", "-Command", $backendCmd `
        -WorkingDirectory $BackendPath -PassThru

    # Start Frontend in Dedicated Labeled Terminal
    $frontendCmd = "`$host.UI.RawUI.WindowTitle = '[CSx CORE] Frontend Presentation Matrix :: Port $FrontendPort'; Write-Host '[+] [CSx CORE] FRONTEND MATRIX ONLINE' -ForegroundColor Green; npm run dev"
    $frontendProcess = Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoExit", "-Command", $frontendCmd `
        -WorkingDirectory $FrontendPath -PassThru

    Log-OK "Backend Console Initialized : Window PID $($backendProcess.Id) (Target Port $BackendPort)"
    Log-OK "Frontend Console Initialized: Window PID $($frontendProcess.Id) (Target Port $FrontendPort)"

    $runtimeData = @{
        mode         = "Windowed"
        startedAt    = (Get-Date).ToString("o")
        backendPid   = $backendProcess.Id
        frontendPid  = $frontendProcess.Id
        backendPort  = $BackendPort
        frontendPort = $FrontendPort
    } | ConvertTo-Json
    $runtimeData | Out-File -Encoding utf8 -FilePath $RuntimeFile
}

# ------------------------------------------------------------------------------
# 5. Real-Time Telemetry Radar (Health Probe)
# ------------------------------------------------------------------------------
Log-Step "STAGE 05" "Establishing Neural Telemetry Link (Probing Services)..."

$backendHealthy  = $false
$frontendHealthy = $false
$maxAttempts     = 30
$attempt         = 0

Write-Host "  [RADAR] Polling endpoints for live handshake response..." -ForegroundColor DarkCyan

while ((-not ($backendHealthy -and $frontendHealthy)) -and ($attempt -lt $maxAttempts)) {
    $attempt++
    Start-Sleep -Seconds 1

    if (-not $backendHealthy) {
        try {
            $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$BackendPort/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($resp -and $resp.StatusCode -eq 200) {
                $backendHealthy = $true
                Log-OK "Backend Gateway Responded: HTTP 200 OK (http://localhost:$BackendPort/api/health)"
            }
        } catch { }
    }

    if (-not $frontendHealthy) {
        try {
            $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$FrontendPort" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($resp -and ($resp.StatusCode -eq 200 -or $resp.StatusCode -eq 304)) {
                $frontendHealthy = $true
                Log-OK "Frontend Matrix Responded: HTTP 200 OK (http://localhost:$FrontendPort)"
            }
        } catch { }
    }

    # Pulse animation
    Write-Host -NoNewline "." -ForegroundColor DarkCyan
}
Write-Host ""

# ------------------------------------------------------------------------------
# 6. Master Command HUD
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "  ================================================================" -ForegroundColor Green
Write-Host "  [+] CSx CORE :: MASTER FULL-STACK MATRIX IS ONLINE" -ForegroundColor Green
Write-Host "  ================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "   INTERFACE                 STATUS      URL" -ForegroundColor DarkCyan
Write-Host "   ---------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "   Frontend Presentation     [ONLINE]    http://localhost:$FrontendPort" -ForegroundColor White
Write-Host "   Backend API Engine        [ONLINE]    http://localhost:$BackendPort" -ForegroundColor White
Write-Host "   API Health Check          [ONLINE]    http://localhost:$BackendPort/api/health" -ForegroundColor White
Write-Host "   Admin Secret Terminal     [ARMED]     http://localhost:$FrontendPort/auth/admin" -ForegroundColor Yellow
Write-Host "   Admin Cipher Shortcut     [ACTIVE]    Type '190436' on /auth" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ================================================================" -ForegroundColor DarkGray
Write-Host "  OPERATIONAL CONTROLS:" -ForegroundColor Magenta
Write-Host "   * To stop and clean all processes safely, execute:" -ForegroundColor Gray
Write-Host "       .\stop_all.ps1" -ForegroundColor Green
Write-Host "   * Backend Logs  : $(if ($Headless) { '.logs/backend.stdout.log' } else { 'Dedicated Terminal Window' })" -ForegroundColor Gray
Write-Host "   * Frontend Logs : $(if ($Headless) { '.logs/frontend.stdout.log' } else { 'Dedicated Terminal Window' })" -ForegroundColor Gray
Write-Host "  ================================================================" -ForegroundColor DarkGray
Write-Host ""

if ($OpenBrowser) {
    Start-Process "http://localhost:$FrontendPort"
}
