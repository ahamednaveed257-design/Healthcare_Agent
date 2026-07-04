param(
    [int]$MaxMegabytes = 15
)

$ErrorActionPreference = "Stop"
$limit = $MaxMegabytes * 1MB
$root = Split-Path -Parent $PSScriptRoot

$excludedSegments = @(
    ".git",
    ".pytest_cache",
    "__pycache__",
    "node_modules"
)

$files = Get-ChildItem -LiteralPath $root -Recurse -File -Force | Where-Object {
    $path = $_.FullName
    -not ($excludedSegments | Where-Object {
        $path -like "*\$_\*"
    })
}

$tooLarge = $files | Where-Object { $_.Length -gt $limit } | Sort-Object Length -Descending

if ($tooLarge) {
    Write-Host "Files larger than $MaxMegabytes MB:"
    $tooLarge | Select-Object @{Name="MB";Expression={[math]::Round($_.Length / 1MB, 2)}}, FullName | Format-Table -AutoSize
    exit 1
}

$largest = $files | Sort-Object Length -Descending | Select-Object -First 10
Write-Host "All files are under $MaxMegabytes MB."
$largest | Select-Object @{Name="MB";Expression={[math]::Round($_.Length / 1MB, 3)}}, FullName | Format-Table -AutoSize
