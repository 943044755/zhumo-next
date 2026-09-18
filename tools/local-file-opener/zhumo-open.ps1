# zhumo-open:// protocol handler (per-user, registered under HKCU by register-protocol.cmd)
# Receives: zhumo-open://<url-encoded-absolute-path>
# Decodes it, verifies the file exists, then opens it with the default program.
# ASCII only on purpose: PowerShell 5.1 reads .ps1 without BOM as ANSI.
# Debug: every invocation appends a line to %TEMP%\zhumo-open.log (delete this block when stable).

param([string]$Url)

$log = Join-Path $env:TEMP 'zhumo-open.log'
function Note($m) { Add-Content -LiteralPath $log -Value ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) }

Note ("in: " + $Url)

$s = "$Url" -replace '(?i)^zhumo-open://', ''
$s = [Uri]::UnescapeDataString($s).Trim('"')
Note ("decoded: " + $s)
if (-not $s) { Note 'reject: empty'; exit 1 }

# Only absolute local paths; refuse anything that smells like a URL or relative traversal.
if ($s -notmatch '^[A-Za-z]:[\\/]') { Note 'reject: not absolute drive path'; exit 1 }
if ($s -match '^[A-Za-z]:[^\\/]') { Note 'reject: drive-relative form'; exit 1 }

$exists = Test-Path -LiteralPath $s -PathType Leaf
Note ("exists: " + $exists)
if ($exists) {
    Start-Process -FilePath $s
    Note 'opened'
}
