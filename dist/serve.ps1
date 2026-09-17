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
