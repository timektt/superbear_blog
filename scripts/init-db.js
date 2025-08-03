#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Initializing database setup...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log(
    '📝 Please create .env.local file with your database connection string.'
  );
  console.log('💡 You can copy from .env.local.template\n');
  process.exit(1);
}

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Push schema to database
  console.log('\n🗄️  Pushing schema to database...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  // Run seed (optional)
  console.log('\n🌱 Running database seed...');
  try {
    execSync('npm run db:seed', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Seed failed (this is optional)');
  }

  console.log('\n✅ Database setup completed!');
  console.log('🎉 You can now start the development server with: npm run dev');
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}
