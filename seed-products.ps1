# PowerShell script to seed sample products
Write-Host "🌱 Seeding sample products..." -ForegroundColor Green

$baseUrl = "http://localhost:3000"

$products = @(
    @{name="Phở Bò Đặc Biệt"; price=65000; imageUrl="https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400"},
    @{name="Bánh Mì Thịt"; price=25000; imageUrl="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400"},
    @{name="Bún Chả Hà Nội"; price=55000; imageUrl="https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400"},
    @{name="Cơm Tấm Sườn"; price=45000; imageUrl="https://images.unsplash.com/photo-1626074353765-517a65ead1c2?w=400"},
    @{name="Gỏi Cuốn"; price=35000; imageUrl="https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400"},
    @{name="Cà Phê Sữa Đá"; price=20000; imageUrl="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400"},
    @{name="Trà Sữa Trân Châu"; price=30000; imageUrl="https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400"},
    @{name="Sinh Tố Bơ"; price=35000; imageUrl="https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400"}
)

$count = 0
foreach ($product in $products) {
    $count++
    Write-Host "Adding product $count..." -ForegroundColor Yellow
    
    $body = $product | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/products" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -UseBasicParsing
        
        $result = $response.Content | ConvertFrom-Json
        if ($result.success) {
            Write-Host "  ✓ Added: $($product.name)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Failed: $($result.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "✅ Done! Added $count products." -ForegroundColor Green
Write-Host "📋 View products at: $baseUrl/products" -ForegroundColor Cyan
