$ErrorActionPreference = 'Stop'
$repo = 'B-Divyesh/sf-stocktake-reconcile'
$base = "https://github.com/$repo/releases/latest/download"
$dir = Join-Path $env:TEMP 'stocktake-reconcile-install'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$manifest = Join-Path $dir 'latest.json'
Invoke-WebRequest "$base/latest.json" -OutFile $manifest
$data = Get-Content $manifest -Raw | ConvertFrom-Json
$url = $data.platforms.windows.url
$file = [System.IO.Path]::GetFileName($url)
$asset = Join-Path $dir $file
Invoke-WebRequest $url -OutFile $asset
Invoke-WebRequest "$base/SHA256SUMS" -OutFile (Join-Path $dir 'SHA256SUMS')
$expected = ((Get-Content (Join-Path $dir 'SHA256SUMS')) | Where-Object { $_ -match [regex]::Escape($file) } | Select-Object -First 1).Split()[0]
$actual = (Get-FileHash $asset -Algorithm SHA256).Hash.ToLower()
if ($actual -ne $expected.ToLower()) { throw "Checksum verification failed for $file" }
Write-Host "Verified $file. Windows may warn because this installer is unsigned."
if ($file.EndsWith('.msi')) { Start-Process msiexec.exe -ArgumentList "/i `"$asset`"" -Wait } else { Start-Process $asset -Wait }
Write-Host 'Stocktake Reconcile installation completed.'
