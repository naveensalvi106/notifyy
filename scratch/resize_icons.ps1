Add-Type -AssemblyName System.Drawing
$sourcePath = "c:\Users\navee\Downloads\notify\notifyy\resources\icon_real.png"
$resDir = "c:\Users\navee\Downloads\notify\notifyy\android\app\src\main\res"

function Resize-Icon($size, $targetFolder, $targetName) {
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
    Write-Host "Created $size x $size in $targetFolder"
}

# Standard sizes
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

# Adaptive foreground bitmap (use a larger size for better scaling)
Resize-Icon 512 "drawable" "ic_launcher_foreground_bitmap.png"
