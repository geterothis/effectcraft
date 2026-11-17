# Close Adobe crash reporter windows of HEADLESS After Effects only (aerender / -noui), i.e. "Don't send".
# Reports of the user's interactive AE are never touched (their envelope has no "headless":"true").
param([string]$LogFile, [int]$Seconds = 0)
$t0 = Get-Date
while ($true) {
    Get-CimInstance Win32_Process -Filter "Name='AdobeCrashReport.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
        $m = [regex]::Match([string]$_.CommandLine, '"([^"]+\.envelope(?:\.acr)?)"')
        if ($m.Success) {
            $headless = $false
            foreach ($f in @($m.Groups[1].Value, $m.Groups[1].Value + ".acr")) {
                if (Test-Path $f) {
                    $txt = [IO.File]::ReadAllText($f, [Text.Encoding]::GetEncoding(28591))
                    if ($txt -match '"headless"\s*:\s*"true"') { $headless = $true }
                }
            }
            if ($headless) {
                Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
                if ($LogFile) { "{0:s} closed headless crash report pid={1} {2}" -f (Get-Date), $_.ProcessId, $m.Groups[1].Value | Out-File $LogFile -Append -Encoding utf8 }
            }
        }
    }
    if ($Seconds -gt 0 -and ((Get-Date) - $t0).TotalSeconds -ge $Seconds) { break }
    Start-Sleep -Seconds 2
}
