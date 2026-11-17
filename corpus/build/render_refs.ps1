# Render every queued reference item of the corpus with aerender (AE 2026) and log wall-clock timings.
param([string]$Only = "")
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$aer = "C:\Program Files\Adobe\Adobe After Effects 2026\Support Files\aerender.exe"
$timDir = Join-Path $root "reference\timings"
New-Item -ItemType Directory -Force $timDir | Out-Null
$logDir = Join-Path $timDir "aerender_logs"
New-Item -ItemType Directory -Force $logDir | Out-Null
$csv = Join-Path $timDir "aerender_timings.csv"
if (-not (Test-Path $csv)) { "project,seconds_wall,exit_code,items_finished,started" | Out-File $csv -Encoding utf8 }

$files = Get-ChildItem (Join-Path $root "aep\ae2026_v26") -Recurse -Filter *.aep | Where-Object { $_.FullName -notmatch "\\_harness\\" } | Sort-Object FullName
if ($Only) { $files = $files | Where-Object { $_.BaseName -like $Only } }
foreach ($f in $files) {
    $log = Join-Path $logDir ($f.BaseName + ".log")
    $start = Get-Date
    $sw = [Diagnostics.Stopwatch]::StartNew()
    & $aer -project $f.FullName -sound OFF -v ERRORS_AND_PROGRESS *> $log
    $code = $LASTEXITCODE
    $sw.Stop()
    $done = (Select-String -Path $log -Pattern "Finished composition" -SimpleMatch -ErrorAction SilentlyContinue | Measure-Object).Count
    "{0},{1:N2},{2},{3},{4:s}" -f $f.BaseName, $sw.Elapsed.TotalSeconds, $code, $done, $start | Out-File $csv -Append -Encoding utf8
    Write-Output ("{0}  {1:N1}s  exit={2}  items={3}" -f $f.BaseName, $sw.Elapsed.TotalSeconds, $code, $done)
}
