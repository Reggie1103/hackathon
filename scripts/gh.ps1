$ErrorActionPreference = "Stop"

$systemGh = Get-Command gh -ErrorAction SilentlyContinue
if ($null -ne $systemGh) {
    & $systemGh.Source @args
    exit $LASTEXITCODE
}

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$portableGh = Get-ChildItem `
    -LiteralPath (Join-Path $repositoryRoot ".tools\gh") `
    -Recurse `
    -Filter "gh.exe" `
    -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($null -eq $portableGh) {
    throw "GitHub CLI was not found. Install gh or place the portable distribution under .tools/gh/."
}

& $portableGh.FullName @args
exit $LASTEXITCODE

