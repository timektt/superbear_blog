# Production startup script for SuperBear Blog (PowerShell)
# This script handles database migrations and starts the application with monitoring

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting SuperBear Blog production deployment..." -ForegroundColor Green
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# Check Node.js version
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Gray

# Check if required environment variables are set
$requiredVars = @("DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL")
$optionalVars = @("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET")

foreach ($var in $requiredVars) {
    if (-not (Get-ChildItem Env:$var -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Error: $var environment variable is not set" -ForegroundColor Red
        exit 1
    }
}

foreach ($var in $optionalVars) {
    if (-not (Get-ChildItem Env:$var -ErrorAction SilentlyContinue)) {
        Write-Host "⚠️ Warning: $var environment variable is not set (optional)" -ForegroundColor Yellow
    }
}

Write-Host "✅ Environment variables validated" -ForegroundColor Green

# Set production environment
$env:NODE_ENV = "production"
Write-Host "Environment: $env:NODE_ENV" -ForegroundColor Gray

# Generate Prisma client
Write-Host "📦 Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma client generated successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate Prisma client: $_" -ForegroundColor Red
    exit 1
}

# Run database migrations
Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
try {
    npx prisma migrate deploy
    Write-Host "✅ Database migrations completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Database migration failed: $_" -ForegroundColor Red
    exit 1
}

# Check database connection
Write-Host "🔍 Checking database connection..." -ForegroundColor Yellow
try {
    npx prisma db pull --force --silent
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Database connection failed: $_" -ForegroundColor Red
    exit 1
}

# Health check function
function Test-ApplicationHealth {
    param([string]$url = "http://localhost:3000/api/health")
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 10
        if ($response.status -eq "ok") {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

# Start the application
Write-Host "🌟 Starting application..." -ForegroundColor Green
Write-Host "Application will be available at: http://localhost:3000" -ForegroundColor Cyan

# Start application in background for health check
$job = Start-Job -ScriptBlock { npm start }

# Wait for application to start and perform health check
Write-Host "⏳ Waiting for application to start..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

do {
    Start-Sleep -Seconds 2
    $attempt++
    $isHealthy = Test-ApplicationHealth
    
    if ($isHealthy) {
        Write-Host "✅ Application is healthy and ready!" -ForegroundColor Green
        break
    }
    
    if ($attempt -ge $maxAttempts) {
        Write-Host "❌ Application failed to start within timeout" -ForegroundColor Red
        Stop-Job $job
        Remove-Job $job
        exit 1
    }
    
    Write-Host "Attempt $attempt/$maxAttempts - Application not ready yet..." -ForegroundColor Gray
} while ($true)

# Stop the background job and start normally
Stop-Job $job
Remove-Job $job

Write-Host "🎉 Production deployment successful!" -ForegroundColor Green
Write-Host "Starting application in foreground..." -ForegroundColor Cyan

# Start application normally
npm start