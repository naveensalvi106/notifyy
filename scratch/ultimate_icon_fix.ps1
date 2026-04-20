Add-Type -AssemblyName System.Drawing
$sourcePath = "c:\Users\navee\Downloads\notify\notifyy\resources\icon_real.png"
$resDir = "c:\Users\navee\Downloads\notify\notifyy\android\app\src\main\res"

# Cleanup task: Remove all existing ic_launcher files to avoid conflicts
Write-Host "Cleaning up old icon files..."
Get-ChildItem -Path $resDir -Filter "ic_launcher*" -Recurse | Remove-Item -Force
Write-Host "Cleanup complete."

function Resize-Icon($size, $targetFolder, $targetName) {
    if ($size -eq 0) { return }
    $src = [System.Drawing.Image]::FromFile($sourcePath)
    $dest = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $size, $size)
    
    $fullPath = Join-Path $resDir $targetFolder
    if (!(Test-Path $fullPath)) { New-Item -ItemType Directory -Path $fullPath }
    $destPath = Join-Path $fullPath $targetName
    $dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $dest.Dispose()
    $src.Dispose()
    Write-Host "Created $size x $size in $targetFolder\$targetName"
}

# 1. Generate Legacy Icons (Square and Round)
Resize-Icon 48 "mipmap-mdpi" "ic_launcher.png"
Resize-Icon 48 "mipmap-mdpi" "ic_launcher_round.png"
Resize-Icon 72 "mipmap-hdpi" "ic_launcher.png"
Resize-Icon 72 "mipmap-hdpi" "ic_launcher_round.png"
Resize-Icon 96 "mipmap-xhdpi" "ic_launcher.png"
Resize-Icon 96 "mipmap-xhdpi" "ic_launcher_round.png"
Resize-Icon 144 "mipmap-xxhdpi" "ic_launcher.png"
Resize-Icon 144 "mipmap-xxhdpi" "ic_launcher_round.png"
Resize-Icon 192 "mipmap-xxxhdpi" "ic_launcher.png"
Resize-Icon 192 "mipmap-xxxhdpi" "ic_launcher_round.png"

# 2. Generate Adaptive Foreground (Blue Note logo on transparent)
# We use 432x432 for adaptive foreground (108dp * 4)
Resize-Icon 512 "drawable-xxxhdpi" "ic_launcher_foreground.png"

# 3. Create Adaptive XMLs
$anyDpiDir = Join-Path $resDir "mipmap-anydpi-v26"
if (!(Test-Path $anyDpiDir)) { New-Item -ItemType Directory -Path $anyDpiDir }

$xmlContent = @"
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
"@

$xmlContent | Out-File -FilePath (Join-Path $anyDpiDir "ic_launcher.xml") -Encoding utf8
$xmlContent | Out-File -FilePath (Join-Path $anyDpiDir "ic_launcher_round.xml") -Encoding utf8

# 4. Ensure Background is White
$valuesDir = Join-Path $resDir "values"
if (!(Test-Path $valuesDir)) { New-Item -ItemType Directory -Path $valuesDir }
@"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>
"@ | Out-File -FilePath (Join-Path $valuesDir "ic_launcher_background.xml") -Encoding utf8
