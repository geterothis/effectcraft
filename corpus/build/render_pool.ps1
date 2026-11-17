# Parallel aerender (AE 2026) pool: a job queue of {id, project, rqindex?}, N workers, lock file per job,
# own log per job, crash/failure -> one retry, then "failed". Never touches the user's interactive AE.
# Usage: render_pool.ps1 -Queue <dir with jobs.json> -Workers 4
param([Parameter(Mandatory)][string]$Queue, [int]$Workers = 4)
$ErrorActionPreference = "Stop"
$aer = "C:\Program Files\Adobe\Adobe After Effects 2026\Support Files\aerender.exe"
$jobs = Get-Content (Join-Path $Queue "jobs.json") -Raw | ConvertFrom-Json
foreach ($d in "locks", "logs", "results") { New-Item -ItemType Directory -Force (Join-Path $Queue $d) | Out-Null }
$sw = [Diagnostics.Stopwatch]::StartNew()

$worker = {
    param($Queue, $aer, $wid)
    $jobs = Get-Content (Join-Path $Queue "jobs.json") -Raw | ConvertFrom-Json
    foreach ($j in $jobs) {
        $lock = Join-Path $Queue "locks\$($j.id).lock"
        try { [IO.File]::Open($lock, 'CreateNew', 'Write').Close() } catch { continue }   # claimed by another worker
        $res = $null
        for ($attempt = 1; $attempt -le 2; $attempt++) {
            $log = Join-Path $Queue "logs\$($j.id).try$attempt.log"
            $aargs = @("-project", $j.project, "-sound", "OFF", "-v", "ERRORS_AND_PROGRESS")
            if ($j.rqindex) { $aargs += @("-rqindex", [string]$j.rqindex) }
            $t = [Diagnostics.Stopwatch]::StartNew()
            & $aer @aargs *> $log
            $code = $LASTEXITCODE
            $t.Stop()
            $txt = Get-Content $log -Raw -ErrorAction SilentlyContinue
            $ok = ($code -eq 0) -and ($txt -notmatch "aerender ERROR|crash|unexpected") -and ($txt -match "Total Time Elapsed")
            $res = [ordered]@{ id = $j.id; worker = $wid; attempt = $attempt; exit = $code; seconds = [math]::Round($t.Elapsed.TotalSeconds, 2); status = $(if ($ok) { "ok" } else { "failed" }) }
            if ($ok) { break }
        }
        ($res | ConvertTo-Json -Compress) | Out-File (Join-Path $Queue "results\$($j.id).json") -Encoding utf8
    }
}

$watch = Start-Job -FilePath (Join-Path $PSScriptRoot "crash_watch.ps1") -ArgumentList (Join-Path $Queue "crashes.log"), 0
$ps = @()
for ($w = 1; $w -le $Workers; $w++) { $ps += Start-Job -ScriptBlock $worker -ArgumentList $Queue, $aer, $w }
$ps | Wait-Job | Out-Null
$ps | Remove-Job
Start-Sleep -Seconds 8   # crash reporter starts a few seconds after the crash
Stop-Job $watch; Remove-Job $watch -Force
$sw.Stop()
$results = Get-ChildItem (Join-Path $Queue "results") -Filter *.json | ForEach-Object { Get-Content $_.FullName -Raw | ConvertFrom-Json }
$sum = ($results | Measure-Object seconds -Sum).Sum
$summary = [ordered]@{
    workers = $Workers; jobs = @($jobs).Count; ok = @($results | Where-Object status -eq "ok").Count
    failed = @($results | Where-Object status -ne "ok" | ForEach-Object id)
    wall_seconds = [math]::Round($sw.Elapsed.TotalSeconds, 1); sum_job_seconds = [math]::Round($sum, 1)
    speedup_vs_sequential = $(if ($sw.Elapsed.TotalSeconds -gt 0) { [math]::Round($sum / $sw.Elapsed.TotalSeconds, 2) } else { 0 })
}
($summary | ConvertTo-Json) | Out-File (Join-Path $Queue "summary.json") -Encoding utf8
$summary | ConvertTo-Json
