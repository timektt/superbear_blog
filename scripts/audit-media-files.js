#!/usr/bin/env node

/**
 * Media Files Audit Script
 * Audits media files for consistency, orphans, and issues
 */

const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Audit database consistency
async function auditDatabaseConsistency() {
  logInfo('Auditing database consistency...');
  
  const issues = [];
  
  try {
    // Check for orphaned references (references without media files)
    const orphanedReferences = await prisma.mediaReference.findMany({
      where: {
        media: null
      },
      include: {
        media: true
      }
    });
    
    if (orphanedReferences.length > 0) {
      issues.push({
        type: 'orphaned_references',
        count: orphanedReferences.length,
        description: 'References pointing to non-existent media files'
      });
      
      logWarning(`Found ${orphanedReferences.length} orphaned references`);
    }
    
    // Check for duplicate media files (same publicId)
    const duplicatePublicIds = await prisma.mediaFile.groupBy({
      by: ['publicId'],
      having: {
        publicId: {
          _count: {
            gt: 1
          }
        }
      },
      _count: {
        publicId: true
      }
    });
    
    if (duplicatePublicIds.length > 0) {
      issues.push({
        type: 'duplicate_public_ids',
        count: duplicatePublicIds.length,
        description: 'Media files with duplicate publicId values'
      });
      
      logWarning(`Found ${duplicatePublicIds.length} duplicate publicId entries`);
    }
    
    // Check for media files without any references
    const unreferencedMedia = await prisma.mediaFile.findMany({
      where: {
        references: {
          none: {}
        }
      }
    });
    
    if (unreferencedMedia.length > 0) {
      issues.push({
        type: 'unreferenced_media',
        count: unreferencedMedia.length,
        description: 'Media files with no references (potential orphans)'
      });
      
      logInfo(`Found ${unreferencedMedia.length} unreferenced media files`);
    }
    
    // Check for invalid URLs
    const invalidUrls = await prisma.mediaFile.findMany({
      where: {
        OR: [
          { url: { equals: '' } },
          { url: { equals: null } },
          { url: { not: { contains: 'cloudinary.com' } } }
        ]
      }
    });
    
    if (invalidUrls.length > 0) {
      issues.push({
        type: 'invalid_urls',
        count: invalidUrls.length,
        description: 'Media files with invalid or missing URLs'
      });
      
      logWarning(`Found ${invalidUrls.length} media files with invalid URLs`);
    }
    
    if (issues.length === 0) {
      logSuccess('Database consistency check passed');
    }
    
    return issues;
    
  } catch (error) {
    logError(`Database consistency audit failed: ${error.message}`);
    return [];
  }
}

// Audit Cloudinary synchronization
async function auditCloudinarySync() {
  logInfo('Auditing Cloudinary synchronization...');
  
  const issues = [];
  
  try {
    // Get all media files from database
    const dbMediaFiles = await prisma.mediaFile.findMany({
      select: {
        id: true,
        publicId: true,
        url: true,
        filename: true
      }
    });
    
    logInfo(`Checking ${dbMediaFiles.length} media files against Cloudinary...`);
    
    let checkedCount = 0;
    let missingInCloudinary = 0;
    let urlMismatches = 0;
    
    // Check each file in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < dbMediaFiles.length; i += batchSize) {
      const batch = dbMediaFiles.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (mediaFile) => {
        try {
          const cloudinaryResource = await cloudinary.api.resource(mediaFile.publicId);
          
          // Check if URL matches
          if (cloudinaryResource.secure_url !== mediaFile.url) {
            urlMismatches++;
            logWarning(`URL mismatch for ${mediaFile.publicId}`);
          }
          
          checkedCount++;
          
        } catch (error) {
          if (error.error && error.error.http_code === 404) {
            missingInCloudinary++;
            logWarning(`Media file not found in Cloudinary: ${mediaFile.publicId}`);
          } else {
            logError(`Error checking ${mediaFile.publicId}: ${error.message}`);
          }
        }
      }));
      
      // Add delay to respect rate limits
      if (i + batchSize < dbMediaFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (missingInCloudinary > 0) {
      issues.push({
        type: 'missing_in_cloudinary',
        count: missingInCloudinary,
        description: 'Media files in database but not in Cloudinary'
      });
    }
    
    if (urlMismatches > 0) {
      issues.push({
        type: 'url_mismatches',
        count: urlMismatches,
        description: 'Media files with URL mismatches between database and Cloudinary'
      });
    }
    
    logInfo(`Checked ${checkedCount} files, ${missingInCloudinary} missing, ${urlMismatches} URL mismatches`);
    
    return issues;
    
  } catch (error) {
    logError(`Cloudinary sync audit failed: ${error.message}`);
    return [];
  }
}

// Audit file sizes and storage usage
async function auditStorageUsage() {
  logInfo('Auditing storage usage...');
  
  try {
    const stats = await prisma.mediaFile.aggregate({
      _sum: { size: true },
      _count: { id: true },
      _avg: { size: true },
      _max: { size: true }
    });
    
    const totalSize = stats._sum.size || 0;
    const fileCount = stats._count.id || 0;
    const avgSize = stats._avg.size || 0;
    const maxSize = stats._max.size || 0;
    
    // Get size distribution
    const sizeRanges = [
      { min: 0, max: 100 * 1024, label: '< 100KB' },
      { min: 100 * 1024, max: 500 * 1024, label: '100KB - 500KB' },
      { min: 500 * 1024, max: 1024 * 1024, label: '500KB - 1MB' },
      { min: 1024 * 1024, max: 5 * 1024 * 1024, label: '1MB - 5MB' },
      { min: 5 * 1024 * 1024, max: 10 * 1024 * 1024, label: '5MB - 10MB' },
      { min: 10 * 1024 * 1024, max: Infinity, label: '> 10MB' }
    ];
    
    const sizeDistribution = [];
    for (const range of sizeRanges) {
      const count = await prisma.mediaFile.count({
        where: {
          size: {
            gte: range.min,
            lt: range.max === Infinity ? undefined : range.max
          }
        }
      });
      
      sizeDistribution.push({
        range: range.label,
        count,
        percentage: fileCount > 0 ? ((count / fileCount) * 100).toFixed(1) : 0
      });
    }
    
    // Get folder distribution
    const folderStats = await prisma.mediaFile.groupBy({
      by: ['folder'],
      _count: { id: true },
      _sum: { size: true }
    });
    
    log('\n📊 Storage Usage Report', 'cyan');
    log('======================\n', 'cyan');
    
    logInfo(`Total files: ${fileCount.toLocaleString()}`);
    logInfo(`Total size: ${formatBytes(totalSize)}`);
    logInfo(`Average size: ${formatBytes(avgSize)}`);
    logInfo(`Largest file: ${formatBytes(maxSize)}`);
    
    log('\nSize distribution:', 'blue');
    sizeDistribution.forEach(dist => {
      log(`  ${dist.range}: ${dist.count} files (${dist.percentage}%)`, 'blue');
    });
    
    log('\nFolder distribution:', 'blue');
    folderStats.forEach(folder => {
      const folderSize = folder._sum.size || 0;
      log(`  ${folder.folder}: ${folder._count.id} files (${formatBytes(folderSize)})`, 'blue');
    });
    
    return {
      totalSize,
      fileCount,
      avgSize,
      maxSize,
      sizeDistribution,
      folderStats
    };
    
  } catch (error) {
    logError(`Storage usage audit failed: ${error.message}`);
    return null;
  }
}

// Audit cleanup operations
async function auditCleanupOperations() {
  logInfo('Auditing cleanup operations...');
  
  try {
    const recentOperations = await prisma.cleanupOperation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    const operationStats = await prisma.cleanupOperation.aggregate({
      _sum: {
        filesProcessed: true,
        filesDeleted: true,
        spaceFreed: true
      },
      _count: { id: true }
    });
    
    const failedOperations = await prisma.cleanupOperation.count({
      where: { status: 'failed' }
    });
    
    log('\n🧹 Cleanup Operations Report', 'cyan');
    log('============================\n', 'cyan');
    
    logInfo(`Total operations: ${operationStats._count.id}`);
    logInfo(`Failed operations: ${failedOperations}`);
    logInfo(`Total files processed: ${operationStats._sum.filesProcessed || 0}`);
    logInfo(`Total files deleted: ${operationStats._sum.filesDeleted || 0}`);
    logInfo(`Total space freed: ${formatBytes(operationStats._sum.spaceFreed || 0)}`);
    
    if (recentOperations.length > 0) {
      log('\nRecent operations:', 'blue');
      recentOperations.forEach(op => {
        const status = op.status === 'completed' ? '✅' : op.status === 'failed' ? '❌' : '⏳';
        log(`  ${status} ${op.createdAt.toISOString().split('T')[0]} - ${op.operationType} (${op.filesDeleted}/${op.filesProcessed} files)`, 'blue');
      });
    }
    
    return {
      totalOperations: operationStats._count.id,
      failedOperations,
      totalProcessed: operationStats._sum.filesProcessed || 0,
      totalDeleted: operationStats._sum.filesDeleted || 0,
      totalSpaceFreed: operationStats._sum.spaceFreed || 0,
      recentOperations
    };
    
  } catch (error) {
    logError(`Cleanup operations audit failed: ${error.message}`);
    return null;
  }
}

// Format bytes to human readable format
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generate recommendations
function generateRecommendations(auditResults) {
  log('\n💡 Recommendations', 'cyan');
  log('==================\n', 'cyan');
  
  const recommendations = [];
  
  // Check for database issues
  const dbIssues = auditResults.databaseIssues || [];
  if (dbIssues.length > 0) {
    dbIssues.forEach(issue => {
      switch (issue.type) {
        case 'orphaned_references':
          recommendations.push('Clean up orphaned references that point to non-existent media files');
          break;
        case 'duplicate_public_ids':
          recommendations.push('Remove duplicate media file entries with the same publicId');
          break;
        case 'unreferenced_media':
          recommendations.push(`Consider cleaning up ${issue.count} unreferenced media files to free up storage`);
          break;
        case 'invalid_urls':
          recommendations.push('Fix or remove media files with invalid URLs');
          break;
      }
    });
  }
  
  // Check for Cloudinary sync issues
  const cloudinaryIssues = auditResults.cloudinaryIssues || [];
  if (cloudinaryIssues.length > 0) {
    cloudinaryIssues.forEach(issue => {
      switch (issue.type) {
        case 'missing_in_cloudinary':
          recommendations.push(`Remove ${issue.count} database entries for files missing in Cloudinary`);
          break;
        case 'url_mismatches':
          recommendations.push(`Update ${issue.count} media file URLs to match Cloudinary`);
          break;
      }
    });
  }
  
  // Storage recommendations
  const storage = auditResults.storageStats;
  if (storage) {
    if (storage.totalSize > 1024 * 1024 * 1024) { // > 1GB
      recommendations.push('Consider implementing automated cleanup for large storage usage');
    }
    
    if (storage.avgSize > 2 * 1024 * 1024) { // > 2MB average
      recommendations.push('Consider implementing image compression to reduce average file size');
    }
  }
  
  // Cleanup recommendations
  const cleanup = auditResults.cleanupStats;
  if (cleanup && cleanup.failedOperations > 0) {
    recommendations.push('Investigate and fix failed cleanup operations');
  }
  
  if (recommendations.length === 0) {
    logSuccess('No issues found - your media management system is in good shape!');
  } else {
    recommendations.forEach((rec, index) => {
      log(`${index + 1}. ${rec}`, 'yellow');
    });
  }
  
  return recommendations;
}

// Main audit function
async function runAudit() {
  log('\n🔍 Media Files Audit', 'cyan');
  log('===================\n', 'cyan');
  
  const auditResults = {};
  
  try {
    // Run all audits
    auditResults.databaseIssues = await auditDatabaseConsistency();
    auditResults.cloudinaryIssues = await auditCloudinarySync();
    auditResults.storageStats = await auditStorageUsage();
    auditResults.cleanupStats = await auditCleanupOperations();
    
    // Generate recommendations
    const recommendations = generateRecommendations(auditResults);
    
    log('\n✅ Audit completed successfully!', 'green');
    
    return {
      ...auditResults,
      recommendations
    };
    
  } catch (error) {
    logError(`Audit failed: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Command line options
const args = process.argv.slice(2);
const options = {
  skipCloudinary: args.includes('--skip-cloudinary'),
  skipStorage: args.includes('--skip-storage'),
  skipCleanup: args.includes('--skip-cleanup'),
  outputJson: args.includes('--json')
};

// Run audit if called directly
if (require.main === module) {
  runAudit().then(results => {
    if (options.outputJson) {
      console.log(JSON.stringify(results, null, 2));
    }
  }).catch(error => {
    logError(`Audit failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAudit,
  auditDatabaseConsistency,
  auditCloudinarySync,
  auditStorageUsage,
  auditCleanupOperations,
  generateRecommendations,
  formatBytes
};