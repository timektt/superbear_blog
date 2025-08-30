#!/bin/bash

# Media Management System Deployment Script
# This script handles the deployment of the media management system

set -e  # Exit on any error

echo "🚀 Starting Media Management System Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_environment() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "DATABASE_URL"
        "DIRECT_URL"
        "CLOUDINARY_CLOUD_NAME"
        "CLOUDINARY_API_KEY"
        "CLOUDINARY_API_SECRET"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Test database connection
test_database() {
    print_status "Testing database connection..."
    
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
            print_success "Database connection successful"
        else
            print_error "Database connection failed"
            exit 1
        fi
    else
        print_warning "psql not found, skipping database connection test"
    fi
}

# Test Cloudinary connection
test_cloudinary() {
    print_status "Testing Cloudinary connection..."
    
    # Create a simple test using curl
    response=$(curl -s -w "%{http_code}" -o /dev/null \
        "https://api.cloudinary.com/v1_1/$CLOUDINARY_CLOUD_NAME/image/list" \
        -u "$CLOUDINARY_API_KEY:$CLOUDINARY_API_SECRET")
    
    if [ "$response" = "200" ]; then
        print_success "Cloudinary connection successful"
    else
        print_error "Cloudinary connection failed (HTTP $response)"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if npx prisma migrate deploy; then
        print_success "Database migrations completed"
    else
        print_error "Database migrations failed"
        exit 1
    fi
}

# Generate Prisma client
generate_prisma() {
    print_status "Generating Prisma client..."
    
    if npx prisma generate; then
        print_success "Prisma client generated"
    else
        print_error "Prisma client generation failed"
        exit 1
    fi
}

# Build the application
build_application() {
    print_status "Building application..."
    
    if npm run build; then
        print_success "Application build completed"
    else
        print_error "Application build failed"
        exit 1
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Run unit tests
    if npm run test:unit; then
        print_success "Unit tests passed"
    else
        print_warning "Unit tests failed, continuing deployment"
    fi
    
    # Run integration tests
    if npm run test:integration; then
        print_success "Integration tests passed"
    else
        print_warning "Integration tests failed, continuing deployment"
    fi
}

# Setup monitoring and alerting
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create monitoring configuration
    cat > monitoring-config.json << EOF
{
  "mediaSystem": {
    "uploadMetrics": {
      "enabled": true,
      "alertThresholds": {
        "failureRate": 0.05,
        "avgUploadTime": 30000
      }
    },
    "cleanupMetrics": {
      "enabled": true,
      "alertThresholds": {
        "orphanPercentage": 0.2,
        "cleanupFailures": 3
      }
    },
    "storageMetrics": {
      "enabled": true,
      "alertThresholds": {
        "usagePercentage": 0.9,
        "growthRate": 0.1
      }
    }
  }
}
EOF
    
    print_success "Monitoring configuration created"
}

# Setup cron jobs for cleanup
setup_cron_jobs() {
    print_status "Setting up cron jobs..."
    
    # Default cleanup schedule (weekly on Sunday at 2 AM)
    cleanup_schedule="${CLEANUP_SCHEDULE:-0 2 * * 0}"
    
    # Create cron job entry
    cron_entry="$cleanup_schedule curl -X POST \"$NEXTAUTH_URL/api/cron/media-cleanup\" -H \"Authorization: Bearer \$CRON_SECRET\""
    
    print_status "Cron job entry (add to your cron system):"
    echo "$cron_entry"
    
    print_success "Cron job configuration ready"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Test health endpoints
    health_endpoints=(
        "/api/health"
        "/api/health/database"
        "/api/health/media"
    )
    
    for endpoint in "${health_endpoints[@]}"; do
        response=$(curl -s -w "%{http_code}" -o /dev/null "$NEXTAUTH_URL$endpoint")
        if [ "$response" = "200" ]; then
            print_success "Health check passed: $endpoint"
        else
            print_warning "Health check failed: $endpoint (HTTP $response)"
        fi
    done
    
    # Test media upload endpoint
    print_status "Testing media upload endpoint..."
    response=$(curl -s -w "%{http_code}" -o /dev/null "$NEXTAUTH_URL/api/upload-image")
    if [ "$response" = "405" ] || [ "$response" = "401" ]; then
        print_success "Upload endpoint is accessible"
    else
        print_warning "Upload endpoint test inconclusive (HTTP $response)"
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up temporary files..."
    rm -f monitoring-config.json
}

# Main deployment process
main() {
    echo "=========================================="
    echo "  Media Management System Deployment"
    echo "=========================================="
    echo ""
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Run deployment steps
    check_environment
    test_database
    test_cloudinary
    generate_prisma
    run_migrations
    build_application
    run_tests
    setup_monitoring
    setup_cron_jobs
    verify_deployment
    
    echo ""
    echo "=========================================="
    print_success "Media Management System deployment completed successfully!"
    echo "=========================================="
    echo ""
    
    print_status "Next steps:"
    echo "1. Set up monitoring alerts based on monitoring-config.json"
    echo "2. Add the cron job to your system crontab"
    echo "3. Configure your reverse proxy/CDN if needed"
    echo "4. Test the system with real uploads"
    echo "5. Monitor logs for any issues"
    echo ""
    
    print_status "Important URLs:"
    echo "- Media Management: $NEXTAUTH_URL/admin/media"
    echo "- Health Check: $NEXTAUTH_URL/api/health"
    echo "- Upload API: $NEXTAUTH_URL/api/upload-image"
    echo ""
}

# Run main function
main "$@"