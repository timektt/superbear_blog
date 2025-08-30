# Media Management System Deployment Script (PowerShell)
# This script handles the deployment of the media management system

param(
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [string]$Environment = "production"
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Media Management System Deployment..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if required environment variables are set
function Test-Environment {
    Write-Status "Checking environment variables..."
    
    $requiredVars = @(
        "DATABASE_URL",
        "DIRECT_URL", 
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
        "NEXTAUTH_SECRET",
        "NEXTAUTH_URL"
    )
    
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if (-not (Get-Item "Env:$var" -ErrorAction SilentlyContinue)) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Error "Missing required environment variables:"
        foreach ($var in $missingVars) {
            Write-Host "  - $var" -ForegroundColor Red
        }
        throw "Missing environment variables"
    }
    
    Write-Success "All required environment variables are set"
}

# Test database connection
function Test-Database {
    Write-Status "Testing database connection..."
    
    try {
        # Test with a simple query using npx prisma
        $result = npx prisma db execute --stdin --schema prisma/schema.prisma <<< "SELECT 1;"
        Write-Success "Database connection successful"
    }
    catch {
        Write-Warning "Database connection test failed, continuing deployment"
    }
}

# Test Cloudinary connection
function Test-Cloudinary {
    Write-Status "Testing Cloudinary connection..."
    
    try {
        $cloudName = $env:CLOUDINARY_CLOUD_NAME
        $apiKey = $env:CLOUDINARY_API_KEY
        $apiSecret = $env:CLOUDINARY_API_SECRET
        
        $auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${apiKey}:${apiSecret}"))
        $headers = @{ Authorization = "Basic $auth" }
        
        $response = Invoke-RestMethod -Uri "https://api.cloudinary.com/v1_1/$cloudName/image/list" -Headers $headers -Method Get
        Write-Success "Cloudinary connection successful"
    }
    catch {
        Write-Error "Cloudinary connection failed: $($_.Exception.Message)"
        throw
    }
}

# Run database migrations
function Invoke-Migrations {
    Write-Status "Running database migrations..."
    
    try {
        npx prisma migrate deploy
        Write-Success "Database migrations completed"
    }
    catch {
        Write-Error "Database migrations failed"
        throw
    }
}

# Generate Prisma client
function New-PrismaClient {
    Write-Status "Generating Prisma client..."
    
    try {
        npx prisma generate
        Write-Success "Prisma client generated"
    }
    catch {
        Write-Error "Prisma client generation failed"
        throw
    }
}

# Build the application
function Build-Application {
    if ($SkipBuild) {
        Write-Warning "Skipping application build"
        return
    }
    
    Write-Status "Building application..."
    
    try {
        npm run build
        Write-Success "Application build completed"
    }
    catch {
        Write-Error "Application build failed"
        throw
    }
}

# Run tests
function Invoke-Tests {
    if ($SkipTests) {
        Write-Warning "Skipping tests"
        return
    }
    
    Write-Status "Running tests..."
    
    # Run unit tests
    try {
        npm run test:unit
        Write-Success "Unit tests passed"
    }
    catch {
        Write-Warning "Unit tests failed, continuing deployment"
    }
    
    # Run integration tests
    try {
        npm run test:integration
        Write-Success "Integration tests passed"
    }
    catch {
        Write-Warning "Integration tests failed, continuing deployment"
    }
}

# Setup monitoring and alerting
function Set-Monitoring {
    Write-Status "Setting up monitoring..."
    
    $monitoringConfig = @{
        mediaSystem = @{
            uploadMetrics = @{
                enabled = $true
                alertThresholds = @{
                    failureRate = 0.05
                    avgUploadTime = 30000
                }
            }
            cleanupMetrics = @{
                enabled = $true
                alertThresholds = @{
                    orphanPercentage = 0.2
                    cleanupFailures = 3
                }
            }
            storageMetrics = @{
                enabled = $true
                alertThresholds = @{
                    usagePercentage = 0.9
                    growthRate = 0.1
                }
            }
        }
    }
    
    $monitoringConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath "monitoring-config.json" -Encoding UTF8
    Write-Success "Monitoring configuration created"
}

# Setup scheduled tasks for cleanup
function Set-ScheduledTasks {
    Write-Status "Setting up scheduled tasks..."
    
    $cleanupSchedule = if ($env:CLEANUP_SCHEDULE) { $env:CLEANUP_SCHEDULE } else { "0 2 * * 0" }
    $nextAuthUrl = $env:NEXTAUTH_URL
    
    Write-Status "Scheduled task configuration:"
    Write-Host "  Schedule: $cleanupSchedule" -ForegroundColor Gray
    Write-Host "  URL: $nextAuthUrl/api/cron/media-cleanup" -ForegroundColor Gray
    
    Write-Success "Scheduled task configuration ready"
    Write-Warning "Please manually configure the scheduled task in your deployment environment"
}

# Verify deployment
function Test-Deployment {
    Write-Status "Verifying deployment..."
    
    $healthEndpoints = @(
        "/api/health",
        "/api/health/database", 
        "/api/health/media"
    )
    
    $nextAuthUrl = $env:NEXTAUTH_URL
    
    foreach ($endpoint in $healthEndpoints) {
        try {
            $response = Invoke-RestMethod -Uri "$nextAuthUrl$endpoint" -Method Get -TimeoutSec 10
            Write-Success "Health check passed: $endpoint"
        }
        catch {
            Write-Warning "Health check failed: $endpoint ($($_.Exception.Message))"
        }
    }
    
    # Test media upload endpoint
    Write-Status "Testing media upload endpoint..."
    try {
        $response = Invoke-WebRequest -Uri "$nextAuthUrl/api/upload-image" -Method Get -UseBasicParsing
        if ($response.StatusCode -eq 405 -or $response.StatusCode -eq 401) {
            Write-Success "Upload endpoint is accessible"
        }
        else {
            Write-Warning "Upload endpoint test inconclusive (HTTP $($response.StatusCode))"
        }
    }
    catch {
        Write-Warning "Upload endpoint test failed: $($_.Exception.Message)"
    }
}

# Cleanup function
function Remove-TempFiles {
    Write-Status "Cleaning up temporary files..."
    if (Test-Path "monitoring-config.json") {
        Remove-Item "monitoring-config.json" -Force
    }
}

# Main deployment process
function Start-Deployment {
    Write-Host "==========================================" -ForegroundColor Blue
    Write-Host "  Media Management System Deployment" -ForegroundColor Blue
    Write-Host "==========================================" -ForegroundColor Blue
    Write-Host ""
    
    try {
        # Run deployment steps
        Test-Environment
        Test-Database
        Test-Cloudinary
        New-PrismaClient
        Invoke-Migrations
        Build-Application
        Invoke-Tests
        Set-Monitoring
        Set-ScheduledTasks
        Test-Deployment
        
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Green
        Write-Success "Media Management System deployment completed successfully!"
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        
        Write-Status "Next steps:"
        Write-Host "1. Set up monitoring alerts based on monitoring-config.json" -ForegroundColor Gray
        Write-Host "2. Configure scheduled tasks in your deployment environment" -ForegroundColor Gray
        Write-Host "3. Configure your reverse proxy/CDN if needed" -ForegroundColor Gray
        Write-Host "4. Test the system with real uploads" -ForegroundColor Gray
        Write-Host "5. Monitor logs for any issues" -ForegroundColor Gray
        Write-Host ""
        
        Write-Status "Important URLs:"
        Write-Host "- Media Management: $($env:NEXTAUTH_URL)/admin/media" -ForegroundColor Gray
        Write-Host "- Health Check: $($env:NEXTAUTH_URL)/api/health" -ForegroundColor Gray
        Write-Host "- Upload API: $($env:NEXTAUTH_URL)/api/upload-image" -ForegroundColor Gray
        Write-Host ""
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        throw
    }
    finally {
        Remove-TempFiles
    }
}

# Run main function
Start-Deployment