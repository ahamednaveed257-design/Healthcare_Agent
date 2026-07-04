param(
    [string]$OutputName = "healthcare-agent-local.zip"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$buildRoot = Join-Path $projectRoot "build"
$stage = Join-Path $buildRoot "healthcare-agent-local"
$zipPath = Join-Path $buildRoot $OutputName
$rootZip = Join-Path $projectRoot "downloads\$OutputName"
$webZip = Join-Path $projectRoot "web\downloads\$OutputName"

function Copy-DirectoryContents {
    param(
        [string]$Source,
        [string]$Destination,
        [string[]]$ExcludeNames = @()
    )

    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    Get-ChildItem -LiteralPath $Source -Force | Where-Object {
        $ExcludeNames -notcontains $_.Name
    } | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $Destination -Recurse -Force
    }
}

New-Item -ItemType Directory -Force -Path $buildRoot | Out-Null
$resolvedBuild = (Resolve-Path $buildRoot).Path
$stageFull = [System.IO.Path]::GetFullPath($stage)
if (-not $stageFull.StartsWith($resolvedBuild, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to clear staging folder outside build: $stageFull"
}

if (Test-Path -LiteralPath $stage) {
    Remove-Item -LiteralPath $stage -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $stage | Out-Null

Copy-DirectoryContents -Source (Join-Path $projectRoot "web") -Destination (Join-Path $stage "web") -ExcludeNames @("downloads")
Copy-DirectoryContents -Source (Join-Path $projectRoot "data") -Destination (Join-Path $stage "data") -ExcludeNames @("chroma")
Copy-DirectoryContents -Source (Join-Path $projectRoot "healthcare_agent") -Destination (Join-Path $stage "healthcare_agent") -ExcludeNames @("__pycache__")
Copy-DirectoryContents -Source (Join-Path $projectRoot "tests") -Destination (Join-Path $stage "tests") -ExcludeNames @("__pycache__", ".pytest_cache")

$rootFiles = @(
    ".env.example",
    ".gitattributes",
    ".gitignore",
    "APP_USAGE_ARCHITECTURE.md",
    "ARCHITECTURE.md",
    "404.html",
    "DEEP_RESEARCH_AGENTIC_MODEL.md",
    "LOCAL_INSTALL.md",
    "README.md",
    "app.css",
    "app.js",
    "build_package.ps1",
    "index.html",
    "launch_app.cmd",
    "manifest.webmanifest",
    "requirements.txt",
    "serve_local.ps1",
    "service-worker.js",
    "start_local_server.cmd",
    "standalone_app.html",
    "streamlit_app.py"
)

foreach ($file in $rootFiles) {
    $source = Join-Path $projectRoot $file
    if (Test-Path -LiteralPath $source) {
        Copy-Item -LiteralPath $source -Destination $stage -Force
    }
}

$packageNote = @"
Healthcare Agent local package

1. Extract this ZIP.
2. Open launch_app.cmd on Windows to use the browser app from localhost.
3. The front page opens first. Use Login on Web or Use Local Mode to enter the workspace.
4. The Python agent model is included in healthcare_agent/.
5. For developer checks, install requirements and run: python -m pytest -q
6. For the Streamlit demo, run: streamlit run streamlit_app.py
"@

Set-Content -LiteralPath (Join-Path $stage "PACKAGE_README.txt") -Value $packageNote -Encoding UTF8

if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}
Compress-Archive -LiteralPath $stage -DestinationPath $zipPath -Force

New-Item -ItemType Directory -Force -Path (Split-Path $webZip -Parent) | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $rootZip -Parent) | Out-Null
Copy-Item -LiteralPath $zipPath -Destination $webZip -Force
Copy-Item -LiteralPath $zipPath -Destination $rootZip -Force

Get-Item -LiteralPath $zipPath, $rootZip, $webZip |
    Select-Object FullName, Length, LastWriteTime
