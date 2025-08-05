# Production startup script for SuperBear Blog (PowerShell)
# This script handles database migrations and starts the application

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting SuperBear Blog production deployment..." -ForegroundColor Green

# Check if required environment variables are set
$requiredVars = @("DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL")
foreach ($var in $requiredVars) {
    if (-not (Get-ChildItem Env:$var -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Error: $var environment variable is not set" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Environment variables validated" -ForegroundColor Green

# Generate Prisma client
Write-Host "📦 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Run database migrations
Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

# Check database connection
Write-Host "🔍 Checking database connection..." -ForegroundColor Yellow
try {
    npx prisma db pull --force
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Database connection failed" -ForegroundColor Red
    exit 1
}

# Start the application
Write-Host "🌟 Starting application..." -ForegroundColor Green
npm start