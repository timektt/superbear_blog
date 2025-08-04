Write-Host "Checking Node.js version..."
node -v

Write-Host "`nChecking required folders..."
$requiredFolders = @("src", "prisma", "public", "node_modules")
foreach ($folder in $requiredFolders) {
    if (-Not (Test-Path $folder)) {
        Write-Host "Missing folder: $folder" -ForegroundColor Red
    } else {
        Write-Host "Found: $folder"
    }
}

Write-Host "`nChecking .env file..."
if (Test-Path ".env") {
    Write-Host ".env exists"
} else {
    Write-Host ".env file missing" -ForegroundColor Red
}

Write-Host "`nValidating Prisma schema..."
npx prisma validate

Write-Host "`nTesting DB connection with 'prisma db push'..."
npx prisma db push

Write-Host "`nStarting dev server in background..."
Start-Process "npm" -ArgumentList "run", "dev" -NoNewWindow
Start-Sleep -Seconds 5

Write-Host "`nChecking /api/articles endpoint..."
try {
    $response = Invoke-WebRequest -Uri http://localhost:3000/api/articles -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "API /api/articles is working"
    } else {
        Write-Host "API returned status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "Failed to reach API endpoint" -ForegroundColor Red
}

Write-Host "`nRunning unit tests..."
npm run test

Write-Host "`nOpening Prisma Studio..."
Start-Process "npx" -ArgumentList "prisma", "studio"

Write-Host "`nChecking sitemap generation..."
try {
    $sitemap = Invoke-WebRequest -Uri http://localhost:3000/sitemap.xml -UseBasicParsing
    if ($sitemap.StatusCode -eq 200) {
        Write-Host "Sitemap is available"
    } else {
        Write-Host "Sitemap returned status: $($sitemap.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "Sitemap not reachable" -ForegroundColor Red
}

Write-Host "`nDone. Manually check UI at http://localhost:3000"
