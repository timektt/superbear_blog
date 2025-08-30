# Pre-deployment validation script for SuperBear Blog
# This script validates the application before production deployment

$ErrorActionPreference = "Stop"

Write-Host "🔍 Running pre-deployment checks for SuperBear Blog..." -ForegroundColor Green
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

$checksPassed = 0
$checksTotal = 0

function Test-Check {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [bool]$Required = $true
    )
    
    $script:checksTotal++
    Write-Host "Checking: $Name..." -ForegroundColor Yellow
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host "✅ $Name - PASSED" -ForegroundColor Green
            $script:checksPassed++
            return $true
        } else {
            if ($Required) {
                Write-Host "❌ $Name - FAILED (Required)" -ForegroundColor Red
            } else {
                Write-Host "⚠️ $Name - FAILED (Optional)" -ForegroundColor Yellow
                $script:checksPassed++
            }
            return $false
        }
    } catch {
        if ($Required) {
            Write-Host "❌ $Name - ERROR: $_" -ForegroundColor Red
        } else {
            Write-Host "⚠️ $Name - ERROR: $_ (Optional)" -ForegroundColor Yellow
            $script:checksPassed++
        }
        return $false
    }
}

# Environment checks
Test-Check "Node.js version (18+)" {
    $version = node --version
    $majorVersion = [int]($version -replace 'v(\d+)\..*', '$1')
    return $majorVersion -ge 18
}

Test-Check "npm is available" {
    npm --version | Out-Null
    return $true
}

# Environment variables
Test-Check "DATABASE_URL is set" {
    return $null -ne $env:DATABASE_URL
}

Test-Check "NEXTAUTH_SECRET is set" {
    return $null -ne $env:NEXTAUTH_SECRET
}

Test-Check "NEXTAUTH_URL is set" {
    return $null -ne $env:NEXTAUTH_URL
}

Test-Check "Cloudinary configuration" {
    return ($null -ne $env:CLOUDINARY_CLOUD_NAME) -and 
           ($null -ne $env:CLOUDINARY_API_KEY) -and 
           ($null -ne $env:CLOUDINARY_API_SECRET)
} -Required $false

# Code quality checks
Test-Check "TypeScript compilation" {
    npm run type-check 2>&1 | Out-Null
    return $LASTEXITCODE -eq 0
}

Test-Check "ESLint validation" {
    npm run lint 2>&1 | Out-Null
    return $LASTEXITCODE -eq 0
}

Test-Check "Prettier formatting" {
    npm run format:check 2>&1 | Out-Null
    return $LASTEXITCODE -eq 0
}

# Build checks
Test-Check "Production build" {
    npm run build:prod 2>&1 | Out-Null
    return $LASTEXITCODE -eq 0
}

Test-Check "Prisma client generation" {
    npx prisma generate 2>&1 | Out-Null
    return $LASTEXITCODE -eq 0
}

# Database checks
Test-Check "Database connection" {
    npx prisma db pull --force --silent 2>&1 | Out-Null
    return $LASTEXITCODE -eq 0
}

Test-Check "Database migrations status" {
    $output = npx prisma migrate status 2>&1
    return -not ($output -match "following migrations have not yet been applied")
}

# Test suite
Test-Check "Unit tests" {
    npm run test:unit 2>&1 | Out-Null
    return $LASTEXITCODE -eq 0
}

Test-Check "Integration tests" {
    npm run test:integration 2>&1 | Out-Null
    return $LASTEXITCODE -eq 0
} -Required $false

# Security checks
Test-Check "No .env files in git" {
    $envFiles = git ls-files | Where-Object { $_ -match '\.env$' }
    return $envFiles.Count -eq 0
}

Test-Check "Dependencies audit" {
    $auditOutput = npm audit --audit-level=high 2>&1
    return -not ($auditOutput -match "found \d+ vulnerabilities")
} -Required $false

# File structure checks
Test-Check "Required files exist" {
    $requiredFiles = @(
        "package.json",
        "next.config.ts",
        "prisma/schema.prisma",
        "src/app/layout.tsx",
        "src/app/page.tsx"
    )
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            return $false
        }
    }
    return $true
}

# Performance checks
Test-Check "Bundle size analysis" {
    if (Test-Path ".next/analyze") {
        $bundleSize = (Get-ChildItem ".next/static" -Recurse | Measure-Object -Property Length -Sum).Sum
        # Check if bundle is under 5MB (reasonable threshold)
        return $bundleSize -lt 5MB
    }
    return $true
} -Required $false

# Summary
Write-Host "`n📊 Pre-deployment Check Summary:" -ForegroundColor Cyan
Write-Host "Checks passed: $checksPassed/$checksTotal" -ForegroundColor $(if ($checksPassed -eq $checksTotal) { "Green" } else { "Yellow" })

if ($checksPassed -eq $checksTotal) {
    Write-Host "`n🎉 All checks passed! Ready for production deployment." -ForegroundColor Green
    exit 0
} else {
    $failedChecks = $checksTotal - $checksPassed
    Write-Host "`n⚠️ $failedChecks check(s) failed. Please review and fix issues before deployment." -ForegroundColor Yellow
    exit 1
}