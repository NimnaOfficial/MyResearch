# ==============================================================================
#  CSx CORE :: MATRIX TERMINATION PROTOCOL
#  File: stop_all.ps1
#  Usage:
#     .\stop_all.ps1           # Terminate all frontend/backend processes and free ports
# ==============================================================================

[CmdletBinding()]
param(
    [int[]]$Ports = @(5000, 3000),
    [switch]$Force
)

$ErrorActionPreference = "Continue"
$RootPath = $PSScriptRoot
if (-not $RootPath) { $RootPath = (Get-Location).Path }
$RuntimeFile = Join-Path $RootPath ".csx_matrix_runtime.json"

# ------------------------------------------------------------------------------
# UI Helpers and Cyber Formatting
# ------------------------------------------------------------------------------
function Print-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ================================================================" -ForegroundColor Red
    Write-Host "  |   CSx CORE :: MATRIX TERMINATION AND SHUTDOWN PROTOCOL      |" -ForegroundColor Red
    Write-Host "  ================================================================" -ForegroundColor Red
    Write-Host "  | Target Workspace : $RootPath" -ForegroundColor DarkRed
    Write-Host "  | Local Timestamp  : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkRed
    Write-Host "  | Target Ports     : $($Ports -join ', ')" -ForegroundColor DarkRed
    Write-Host "  ================================================================" -ForegroundColor Red
    Write-Host ""
}

function Log-Step([string]$step, [string]$msg) {
    Write-Host " [$step] " -ForegroundColor Red -NoNewline
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

function Log-Terminated([string]$msg) {
    Write-Host "  [-] " -ForegroundColor Red -NoNewline
    Write-Host $msg -ForegroundColor DarkRed
}

Print-Banner

$killedPids = @()
$killedDetails = @()

# ------------------------------------------------------------------------------
# 1. Inspect Runtime Registry (.csx_matrix_runtime.json)
# ------------------------------------------------------------------------------
Log-Step "STAGE 01" "Reading Active Process Registry..."

if (Test-Path $RuntimeFile) {
    try {
        $raw = Get-Content $RuntimeFile -Raw | ConvertFrom-Json
        $trackedPids = @()
        if ($raw.backendPid)  { $trackedPids += [int]$raw.backendPid }
        if ($raw.frontendPid) { $trackedPids += [int]$raw.frontendPid }

        Log-OK "Registry found: Mode=$($raw.mode), Started=$($raw.startedAt)"

        foreach ($pidToKill in $trackedPids) {
            $proc = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
            if ($proc) {
                $procName = $proc.ProcessName
                Log-Terminated "Terminating tracked process tree: PID $pidToKill ($procName)..."
                taskkill.exe /PID $pidToKill /T /F 2>$null | Out-Null
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                $killedPids += $pidToKill
                $killedDetails += [PSCustomObject]@{
                    PID         = $pidToKill
                    ProcessName = $procName
                    Source      = "Runtime Registry"
                }
            } else {
                Log-OK "Tracked PID $pidToKill is already terminated."
            }
        }
    } catch {
        Log-Warn "Failed to parse $RuntimeFile. Proceeding with deep port inspection..."
    }
} else {
    Log-OK "No active runtime registry file found. Executing deep port sweep..."
}

# ------------------------------------------------------------------------------
# 2. Port Binding Inspection and Process Termination
# ------------------------------------------------------------------------------
Log-Step "STAGE 02" "Scanning for Listening Network Daemons on Target Ports..."

foreach ($port in $Ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($conns) {
            $owningPids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($p in $owningPids) {
                if ($p -le 4) { continue } # Protect System idle and kernel
                $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
                $procName = if ($proc) { $proc.ProcessName } else { "Unknown" }

                Log-Terminated "Terminating Port $port listener: PID $p ($procName)..."
                taskkill.exe /PID $p /T /F 2>$null | Out-Null
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue

                if ($p -notin $killedPids) {
                    $killedPids += $p
                    $killedDetails += [PSCustomObject]@{
                        PID         = $p
                        ProcessName = $procName
                        Source      = "Port $port Listener"
                    }
                }
            }
        } else {
            Log-OK "Port $port is idle and completely free."
        }
    } catch {
        Log-Warn "Could not inspect port $port connections: $($_.Exception.Message)"
    }
}

# ------------------------------------------------------------------------------
# 3. Sweep for Orphaned Node / Next.js Processes in This Workspace
# ------------------------------------------------------------------------------
Log-Step "STAGE 03" "Sweeping for Workspace-Bound Orphaned Node Engines..."

try {
    $wmiProcs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue
    foreach ($wp in $wmiProcs) {
        $cmdLine = $wp.CommandLine
        if ($cmdLine -and ($cmdLine -like "*$RootPath*" -or $cmdLine -like "*nima-platform*")) {
            $p = $wp.ProcessId
            if ($p -notin $killedPids) {
                Log-Terminated "Terminating orphaned workspace node: PID $p..."
                taskkill.exe /PID $p /T /F 2>$null | Out-Null
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                $killedPids += $p
                $killedDetails += [PSCustomObject]@{
                    PID         = $p
                    ProcessName = "node.exe"
                    Source      = "Workspace Match"
                }
            }
        }
    }
} catch {
    # Non-admin or WMI query restriction: harmless to continue
}

# ------------------------------------------------------------------------------
# 4. State Cleanup
# ------------------------------------------------------------------------------
Log-Step "STAGE 04" "Sanitizing Temporary System State..."

if (Test-Path $RuntimeFile) {
    Remove-Item -Path $RuntimeFile -Force -ErrorAction SilentlyContinue
    Log-OK "Purged active runtime state file (.csx_matrix_runtime.json)."
}

Start-Sleep -Milliseconds 500

# ------------------------------------------------------------------------------
# 5. Final Verification and Telemetry Summary
# ------------------------------------------------------------------------------
Log-Step "STAGE 05" "Performing Verification Probe..."

$allClear = $true
foreach ($port in $Ports) {
    $activeConns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($activeConns) {
        $allClear = $false
        Log-Warn "Port $port is STILL in use by PID $($activeConns.OwningProcess -join ', ')!"
    } else {
        Log-OK "Port $port status: SECURED AND CLOSED [OK]"
    }
}

Write-Host ""
Write-Host "  ================================================================" -ForegroundColor $(if ($allClear) { 'Green' } else { 'Yellow' })
if ($allClear) {
    Write-Host "  [OK] ALL SERVICES TERMINATED AND PORTS FREED SUCCESSFULLY" -ForegroundColor Green
} else {
    Write-Host "  [!] TERMINATION COMPLETE WITH WARNINGS (Check busy ports above)" -ForegroundColor Yellow
}
Write-Host "  ================================================================" -ForegroundColor $(if ($allClear) { 'Green' } else { 'Yellow' })
Write-Host ""

if ($killedDetails.Count -gt 0) {
    Write-Host "  TERMINATED PROCESS LOG:" -ForegroundColor Magenta
    $killedDetails | Format-Table -AutoSize | Out-String | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkGray }
} else {
    Write-Host "   No active services were running. System was already clean." -ForegroundColor Gray
}

Write-Host "  To reignite the platform, execute:" -ForegroundColor Gray
Write-Host "    .\run_all.ps1" -ForegroundColor Cyan
Write-Host ""
