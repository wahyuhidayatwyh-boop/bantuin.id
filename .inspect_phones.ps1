Add-Type -AssemblyName System.Drawing

$srcPath = "D:\APLIKASI\Bantuin\components\image\cta-phones.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Image size: $($bmp.Width) x $($bmp.Height)"

# The phones have black bezels and screens.
# Around the phones is the light blue/white background:
# Colors where R > 200, G > 220, B > 240 (and mascot watermark where R > 190, G > 215, B > 240)
# Let's see what happens if we flood-fill from (0,0) or check background pixels
# Let's inspect corner pixels:
$c1 = $bmp.GetPixel(0, 0)
$c2 = $bmp.GetPixel($bmp.Width - 1, 0)
$c3 = $bmp.GetPixel(0, $bmp.Height - 1)
$c4 = $bmp.GetPixel($bmp.Width - 1, $bmp.Height - 1)
Write-Host "Corner TL: R=$($c1.R) G=$($c1.G) B=$($c1.B)"
Write-Host "Corner TR: R=$($c2.R) G=$($c2.G) B=$($c2.B)"
Write-Host "Corner BL: R=$($c3.R) G=$($c3.G) B=$($c3.B)"
Write-Host "Corner BR: R=$($c4.R) G=$($c4.G) B=$($c4.B)"

$bmp.Dispose()
