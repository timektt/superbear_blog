#!/bin/bash

# Production startup script for SuperBear Blog
# This script handles database migrations and starts the application

set -e

echo "🚀 Starting SuperBear Blog production deployment..."

# Check if required environment variables are set
required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Error: $var environment variable is not set"
    exit 1
  fi
done

echo "✅ Environment variables validated"

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Check database connection
echo "🔍 Checking database connection..."
npx prisma db pull --force || {
  echo "❌ Database connection failed"
  exit 1
}

echo "✅ Database connection successful"

# Start the application
echo "🌟 Starting application..."
exec npm start