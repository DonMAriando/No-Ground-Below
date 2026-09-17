$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$dist = Join-Path $root "dist"
$fontsDir = Join-Path $dist "fonts"

New-Item -ItemType Directory -Force -Path $fontsDir | Out-Null

$fonts = @{
  "barlow-400.woff2" = "https://fonts.gstatic.com/s/barlow/v13/7cHpv4kjgoGqM7E_DMs5.woff2"
  "barlow-600.woff2" = "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E30-8s51os.woff2"
  "barlow-800.woff2" = "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E3q-0s51os.woff2"
  "cormorant-italic.woff2" = "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3smX5slCNuHLi8bLeY9MK7whWMhyjYrGFEsdtdc62E6zd5wDD-iNM8.woff2"
  "cormorant-600.woff2" = "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2"
}
foreach ($name in $fonts.Keys) {
  $out = Join-Path $fontsDir $name
  if (-not (Test-Path $out)) {
    Invoke-WebRequest -Uri $fonts[$name] -OutFile $out -UseBasicParsing
  }
}

$fontCss = @"
@font-face {
  font-family: Barlow;
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("fonts/barlow-400.woff2") format("woff2");
}
@font-face {
  font-family: Barlow;
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("fonts/barlow-600.woff2") format("woff2");
}
@font-face {
  font-family: Barlow;
  font-style: normal;
  font-weight: 800;
  font-display: swap;
  src: url("fonts/barlow-800.woff2") format("woff2");
}
@font-face {
  font-family: "Cormorant Garamond";
  font-style: italic;
  font-weight: 500;
  font-display: swap;
  src: url("fonts/cormorant-italic.woff2") format("woff2");
}
@font-face {
  font-family: "Cormorant Garamond";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("fonts/cormorant-600.woff2") format("woff2");
}
@font-face {
  font-family: "Cormorant Garamond";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("fonts/cormorant-600.woff2") format("woff2");
}

"@

$html = Get-Content (Join-Path $root "index.html") -Raw -Encoding UTF8
$html = $html -replace '(?s)\s*<link rel="preconnect" href="https://fonts\.googleapis\.com" />\s*<link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin />\s*<link href="https://fonts\.googleapis\.com/css2\?[^"]+" rel="stylesheet" />\s*', "`r`n  "
Set-Content -Path (Join-Path $dist "index.html") -Value $html -Encoding UTF8

$css = $fontCss + (Get-Content (Join-Path $root "styles.css") -Raw -Encoding UTF8)
Set-Content -Path (Join-Path $dist "styles.css") -Value $css -Encoding UTF8

Copy-Item (Join-Path $root "game.js") (Join-Path $dist "game.js") -Force

$bat = @"
@echo off
cd /d "%~dp0"
start "" "%~dp0index.html"
"@
Set-Content -Path (Join-Path $dist "JUGAR.bat") -Value $bat -Encoding ASCII

$serveBat = @"
@echo off
cd /d "%~dp0"
echo NO GROUND BELOW
echo.
echo Abriendo http://127.0.0.1:8787
echo Cerra esta ventana para cortar el servidor.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
"@
Set-Content -Path (Join-Path $dist "JUGAR-servidor.bat") -Value $serveBat -Encoding ASCII

$servePs1 = @'
$root = $PSScriptRoot
$port = 8787
$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "text/javascript; charset=utf-8"
  ".woff2" = "font/woff2"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".ico"  = "image/x-icon"
}
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$port/")
try {
  $listener.Start()
} catch {
  Write-Host "No pude abrir el puerto $port. Abro el HTML directo."
  Start-Process (Join-Path $root "index.html")
  exit 1
}
Start-Process "http://127.0.0.1:$port/"
Write-Host "Servidor listo. Cerra esta ventana para salir."
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
  if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }
  $full = [System.IO.Path]::GetFullPath((Join-Path $root $path))
  $rootFull = [System.IO.Path]::GetFullPath($root)
  if (-not $full.StartsWith($rootFull)) {
    $ctx.Response.StatusCode = 403
    $ctx.Response.Close()
    continue
  }
  if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
    $ctx.Response.StatusCode = 404
    $ctx.Response.Close()
    continue
  }
  $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
  $bytes = [System.IO.File]::ReadAllBytes($full)
  $ctx.Response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" })
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.Close()
}
'@
Set-Content -Path (Join-Path $dist "serve.ps1") -Value $servePs1 -Encoding UTF8

$readme = @"
NO GROUND BELOW — build local
=============================

Doble click en JUGAR.bat

Si el audio o el guardado fallan, usa JUGAR-servidor.bat
y deja esa ventana abierta mientras jugas.

R reinicia · Esc pausa · V voz · M audio
"@
Set-Content -Path (Join-Path $dist "LEEME.txt") -Value $readme -Encoding UTF8

$zip = Join-Path $root "No-Ground-Below-dist.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $dist "*") -DestinationPath $zip -Force

Write-Host "Dist lista: $dist"
Write-Host "Zip: $zip"
Get-ChildItem -Recurse $dist | Select-Object FullName, Length | Format-Table -AutoSize
