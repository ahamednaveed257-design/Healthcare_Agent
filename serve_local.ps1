param(
    [int]$Port = 8501,
    [switch]$Open,
    [switch]$FindAvailablePort
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$webRoot = Join-Path $projectRoot "web"
$root = if ([System.IO.Directory]::Exists($webRoot)) { $webRoot } else { $projectRoot }
$storeRoot = Join-Path $projectRoot ".localhost_store"
$address = [System.Net.IPAddress]::Loopback

function Start-Listener {
    param(
        [System.Net.IPAddress]$Address,
        [int]$StartPort,
        [switch]$FindPort
    )

    $lastPort = if ($FindPort) { $StartPort + 20 } else { $StartPort }
    for ($candidate = $StartPort; $candidate -le $lastPort; $candidate++) {
        try {
            $candidateListener = [System.Net.Sockets.TcpListener]::new($Address, $candidate)
            $candidateListener.Start()
            return @{
                Listener = $candidateListener
                Port = $candidate
            }
        }
        catch {
            if (-not $FindPort -or $candidate -eq $lastPort) {
                throw
            }
        }
    }
}

$server = Start-Listener -Address $address -StartPort $Port -FindPort:$FindAvailablePort
$listener = $server.Listener
$Port = $server.Port
$appUrl = "http://localhost:$Port/"

Write-Host "Healthcare Agent is running at $appUrl"
Write-Host "Close this window to stop the local app server."

if ($Open) {
    Start-Process $appUrl
}

function Get-ContentType {
    param([string]$Path)

    switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        ".html" { "text/html; charset=utf-8" }
        ".css" { "text/css; charset=utf-8" }
        ".js" { "application/javascript; charset=utf-8" }
        ".json" { "application/json; charset=utf-8" }
        ".webmanifest" { "application/manifest+json; charset=utf-8" }
        ".svg" { "image/svg+xml" }
        ".png" { "image/png" }
        ".zip" { "application/zip" }
        default { "application/octet-stream" }
    }
}

function Write-Response {
    param(
        [System.IO.Stream]$Stream,
        [int]$StatusCode,
        [string]$Reason,
        [string]$ContentType,
        [byte[]]$Body
    )

    $downloadHeader = ""
    if ($ContentType -eq "application/zip") {
        $downloadHeader = "Content-Disposition: attachment; filename=`"healthcare-agent-local.zip`"`r`n"
    }
    $header = "HTTP/1.1 $StatusCode $Reason`r`nContent-Type: $ContentType`r`n$downloadHeader" +
        "Content-Length: $($Body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    $Stream.Write($Body, 0, $Body.Length)
    $Stream.Flush()
}

function Write-TextResponse {
    param(
        [System.IO.Stream]$Stream,
        [int]$StatusCode,
        [string]$Reason,
        [string]$ContentType,
        [string]$Text
    )

    Write-Response -Stream $Stream -StatusCode $StatusCode -Reason $Reason -ContentType $ContentType -Body ([System.Text.Encoding]::UTF8.GetBytes($Text))
}

function Get-QueryValue {
    param(
        [string]$Target,
        [string]$Name
    )

    $question = $Target.IndexOf("?")
    if ($question -lt 0) {
        return $null
    }

    $query = $Target.Substring($question + 1)
    foreach ($pair in $query.Split("&")) {
        if (-not $pair) {
            continue
        }
        $parts = $pair.Split("=", 2)
        $key = [Uri]::UnescapeDataString($parts[0].Replace("+", " "))
        if ($key -eq $Name) {
            if ($parts.Length -eq 1) {
                return ""
            }
            return [Uri]::UnescapeDataString($parts[1].Replace("+", " "))
        }
    }
    return $null
}

function Get-StoreFilePath {
    param([string]$Key)

    if ([string]::IsNullOrWhiteSpace($Key) -or $Key.Length -gt 180) {
        throw "Invalid store key"
    }

    $encoded = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($Key)).TrimEnd("=").Replace("+", "-").Replace("/", "_")
    return Join-Path $storeRoot "$encoded.json"
}

function Handle-LocalStoreRequest {
    param(
        [System.IO.Stream]$Stream,
        [string]$Method,
        [string]$Target,
        [string]$Path,
        [string]$BodyText
    )

    if ($Path -eq "/api/local-store/health") {
        Write-TextResponse -Stream $Stream -StatusCode 200 -Reason "OK" -ContentType "application/json; charset=utf-8" -Text '{"ok":true,"store":"localhost"}'
        return $true
    }

    if ($Path -ne "/api/local-store") {
        return $false
    }

    try {
        $key = Get-QueryValue -Target $Target -Name "key"
        $filePath = Get-StoreFilePath -Key $key
        New-Item -ItemType Directory -Path $storeRoot -Force | Out-Null

        if ($Method -eq "GET") {
            if ([System.IO.File]::Exists($filePath)) {
                $stored = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
                Write-TextResponse -Stream $Stream -StatusCode 200 -Reason "OK" -ContentType "application/json; charset=utf-8" -Text $stored
            }
            else {
                Write-TextResponse -Stream $Stream -StatusCode 200 -Reason "OK" -ContentType "application/json; charset=utf-8" -Text '{"ok":false,"missing":true}'
            }
            return $true
        }

        if ($Method -eq "PUT") {
            if ([string]::IsNullOrWhiteSpace($BodyText)) {
                Write-TextResponse -Stream $Stream -StatusCode 400 -Reason "Bad Request" -ContentType "application/json; charset=utf-8" -Text '{"ok":false,"error":"empty body"}'
                return $true
            }
            [System.IO.File]::WriteAllText($filePath, $BodyText, [System.Text.Encoding]::UTF8)
            Write-TextResponse -Stream $Stream -StatusCode 200 -Reason "OK" -ContentType "application/json; charset=utf-8" -Text '{"ok":true}'
            return $true
        }

        if ($Method -eq "DELETE") {
            if ([System.IO.File]::Exists($filePath)) {
                Remove-Item -LiteralPath $filePath -Force
            }
            Write-TextResponse -Stream $Stream -StatusCode 200 -Reason "OK" -ContentType "application/json; charset=utf-8" -Text '{"ok":true}'
            return $true
        }

        Write-TextResponse -Stream $Stream -StatusCode 405 -Reason "Method Not Allowed" -ContentType "application/json; charset=utf-8" -Text '{"ok":false,"error":"method not allowed"}'
        return $true
    }
    catch {
        $message = $_.Exception.Message.Replace("\", "\\").Replace('"', '\"')
        Write-TextResponse -Stream $Stream -StatusCode 400 -Reason "Bad Request" -ContentType "application/json; charset=utf-8" -Text "{`"ok`":false,`"error`":`"$message`"}"
        return $true
    }
}

while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
        $stream = $client.GetStream()
        $stream.ReadTimeout = 5000
        $stream.WriteTimeout = 5000
        $reader = [System.IO.StreamReader]::new($stream)
        $requestLine = $reader.ReadLine()
        $requestMethod = "GET"
        $requestTarget = "/"
        $requestPath = "/"
        if ($requestLine -match "^([A-Z]+)\s+([^\s]+)") {
            $requestMethod = $matches[1]
            $requestTarget = $matches[2]
            $requestPath = $requestTarget.Split("?")[0]
        }
        $headers = @{}
        while ($true) {
            $line = $reader.ReadLine()
            if ($null -eq $line -or $line -eq "") {
                break
            }
            if ($line -match "^([^:]+):\s*(.*)$") {
                $headers[$matches[1].ToLowerInvariant()] = $matches[2]
            }
        }

        $bodyText = ""
        $contentLength = 0
        if ($headers.ContainsKey("content-length")) {
            [void][int]::TryParse($headers["content-length"], [ref]$contentLength)
        }
        if ($contentLength -gt 0) {
            if ($contentLength -gt 524288) {
                Write-TextResponse -Stream $stream -StatusCode 413 -Reason "Payload Too Large" -ContentType "application/json; charset=utf-8" -Text '{"ok":false,"error":"payload too large"}'
                continue
            }
            $buffer = New-Object char[] $contentLength
            $read = 0
            while ($read -lt $contentLength) {
                $chunk = $reader.Read($buffer, $read, $contentLength - $read)
                if ($chunk -le 0) {
                    break
                }
                $read += $chunk
            }
            if ($read -gt 0) {
                $bodyText = -join $buffer[0..($read - 1)]
            }
        }

        if (Handle-LocalStoreRequest -Stream $stream -Method $requestMethod -Target $requestTarget -Path $requestPath -BodyText $bodyText) {
            continue
        }

        if ($requestPath -eq "/") {
            $requestPath = if ([System.IO.File]::Exists((Join-Path $root "index.html"))) { "/index.html" } else { "/standalone_app.html" }
        }

        if ($requestPath.StartsWith("/web/", [System.StringComparison]::OrdinalIgnoreCase)) {
            $requestPath = $requestPath.Substring(4)
        }

        $relativePath = [Uri]::UnescapeDataString($requestPath.TrimStart("/")).Replace("/", [System.IO.Path]::DirectorySeparatorChar)
        $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))
        $rootPath = [System.IO.Path]::GetFullPath($root).TrimEnd("\", "/") + [System.IO.Path]::DirectorySeparatorChar

        if (-not $filePath.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase) -or -not [System.IO.File]::Exists($filePath)) {
            Write-TextResponse -Stream $stream -StatusCode 404 -Reason "Not Found" -ContentType "text/plain; charset=utf-8" -Text "Not found"
            continue
        }

        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $contentType = Get-ContentType -Path $filePath
        Write-Response -Stream $stream -StatusCode 200 -Reason "OK" -ContentType $contentType -Body $bytes
    }
    catch {
        Write-Host $_.Exception.Message
    }
    finally {
        $client.Close()
    }
}
