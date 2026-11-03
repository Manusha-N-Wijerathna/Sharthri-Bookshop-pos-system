Add-Type -AssemblyName System.Drawing

$src = "C:/Users/User/.gemini/antigravity/brain/1b4f8b95-337b-497d-af7e-02680860fb73/.user_uploaded/media_1793735163627_cb39c1dd.jpg"
$destDir = "D:/Sharthri-Bookshop-pos-system/bookshop-pos/public/icons"
$publicDir = "D:/Sharthri-Bookshop-pos-system/bookshop-pos/public"

if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
}

# Copy original high-res banner
Copy-Item -Path $src -Destination "$publicDir/brand-banner.jpg" -Force

# Load source image
$original = [System.Drawing.Bitmap]::FromFile($src)
$origW = $original.Width
$origH = $original.Height

# We create square PWA icons: 72, 96, 128, 144, 152, 180 (apple), 192, 384, 512
$sizes = @(72, 96, 128, 144, 152, 180, 192, 384, 512)

# Function to generate square icon with clean fitted padding or centered crop
function Generate-Square-Icon($targetSize, $outputPath, $isMaskable = $false) {
    $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # High quality settings
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Clean background: matching the logo's white/pearl tint
    $bgColor = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
    $g.Clear($bgColor)

    # For maskable, safe zone is 80%, so fit inside 75%
    $paddingFactor = if ($isMaskable) { 0.72 } else { 0.88 }
    $availW = [int]($targetSize * $paddingFactor)
    $availH = [int]($targetSize * $paddingFactor)

    # Calculate aspect ratio
    $scale = [Math]::Min($availW / $origW, $availH / $origH)
    $drawW = [int]($origW * $scale)
    $drawH = [int]($origH * $scale)

    $destX = [int](($targetSize - $drawW) / 2)
    $destY = [int](($targetSize - $drawH) / 2)

    # Draw image
    $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $drawW, $drawH)
    $g.DrawImage($original, $destRect, 0, 0, $origW, $origH, [System.Drawing.GraphicsUnit]::Pixel)

    $g.Dispose()
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $outputPath"
}

# Generate standard icons
foreach ($s in $sizes) {
    if ($s -eq 180) {
        Generate-Square-Icon 180 "$destDir/apple-touch-icon.png" $false
    } else {
        Generate-Square-Icon $s "$destDir/icon-$($s)x$($s).png" $false
    }
}

# Generate maskable icons
Generate-Square-Icon 192 "$destDir/icon-maskable-192x192.png" $true
Generate-Square-Icon 512 "$destDir/icon-maskable-512x512.png" $true

# Also generate favicon.png and apple-touch-icon in /public
Generate-Square-Icon 192 "$publicDir/favicon.png" $false
Generate-Square-Icon 180 "$publicDir/apple-touch-icon.png" $false

# Generate brand logo (fitted transparent/white)
Generate-Square-Icon 512 "$publicDir/brand-logo.png" $false

$original.Dispose()
Write-Host "All PWA icons generated successfully!"

