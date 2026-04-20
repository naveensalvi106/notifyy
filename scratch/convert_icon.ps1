Add-Type -AssemblyName System.Drawing
$inputPath = "c:\Users\navee\Downloads\notify\notifyy\resources\icon.png"
$outputPath = "c:\Users\navee\Downloads\notify\notifyy\resources\icon_real.png"
$img = [System.Drawing.Image]::FromFile($inputPath)
$img.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
