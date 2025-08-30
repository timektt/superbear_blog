#!/usr/bin/env node

/**
 * Media References Extraction Script
 * Scans existing content and extracts media references for tracking
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

// Extract image references from HTML content
function extractImageReferences(content) {
  if (!content) return [];

  const references = [];
  
  // Match img tags with Cloudinary URLs
  const imgRegex = /<img[^>]+src=["']([^"']*cloudinary[^"']*)["'][^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(content)) !== null) {
    const url = match[1];
    
    // Extract public ID from Cloudinary URL
    const publicIdMatch = url.match(/\/v\d+\/([^/]+\/[^/.]+)/);
    if (publicIdMatch) {
      references.push(publicIdMatch[1]);
    }
  }
  
  // Also check for direct Cloudinary URLs in content
  const directUrlRegex = /https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/v\d+\/([^/\s"'<>]+)/gi;
  
  while ((match = directUrlRegex.exec(content)) !== null) {
    const publicId = match[1];
    if (!references.includes(publicId)) {
      references.push(publicId);
    }
  }
  
  return references;
}

// Extract references from articles
async function extractArticleReferences() {
  logInfo('Extracting references from articles...');
  
  try {
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        coverImage: true
      }
    });
    
    let totalReferences = 0;
    let articlesProcessed = 0;
    
    for (const article of articles) {
      const references = [];
      
      // Extract from content
      if (article.content) {
        const contentRefs = extractImageReferences(article.content);
        references.push(...contentRefs);
      }
      
      // Add cover image if it exists
      if (article.coverImage) {
        references.push(article.coverImage);
      }
      
      // Remove duplicates
      const uniqueReferences = [...new Set(references)];
      
      if (uniqueReferences.length > 0) {
        logInfo(`Article "${article.title}": Found ${uniqueReferences.length} references`);
        
        // Store references in database
        for (const publicId of uniqueReferences) {
          try {
            await prisma.mediaReference.upsert({
              where: {
                mediaId_contentType_contentId_referenceContext: {
                  mediaId: publicId, // We'll need to find the actual media ID
                  contentType: 'article',
                  contentId: article.id,
                  referenceContext: article.coverImage === publicId ? 'cover_image' : 'content'
                }
              },
              update: {},
              create: {
                mediaId: publicId, // This should be the actual media file ID
                contentType: 'article',
                contentId: article.id,
                referenceContext: article.coverImage === publicId ? 'cover_image' : 'content'
              }
            });
          } catch (error) {
            // Media file might not exist in media_files table yet
            logWarning(`Could not create reference for ${publicId}: ${error.message}`);
          }
        }
        
        totalReferences += uniqueReferences.length;
      }
      
      articlesProcessed++;
    }
    
    logSuccess(`Processed ${articlesProcessed} articles, found ${totalReferences} references`);
    
  } catch (error) {
    logError(`Failed to extract article references: ${error.message}`);
  }
}

// Extract references from newsletters
async function extractNewsletterReferences() {
  logInfo('Extracting references from newsletters...');
  
  try {
    // Check if newsletter tables exist
    const newsletters = await prisma.newsletterIssue.findMany({
      select: {
        id: true,
        title: true,
        content: true
      }
    }).catch(() => []);
    
    if (newsletters.length === 0) {
      logInfo('No newsletters found or newsletter table does not exist');
      return;
    }
    
    let totalReferences = 0;
    
    for (const newsletter of newsletters) {
      const references = extractImageReferences(newsletter.content);
      
      if (references.length > 0) {
        logInfo(`Newsletter "${newsletter.title}": Found ${references.length} references`);
        
        for (const publicId of references) {
          try {
            await prisma.mediaReference.upsert({
              where: {
                mediaId_contentType_contentId_referenceContext: {
                  mediaId: publicId,
                  contentType: 'newsletter',
                  contentId: newsletter.id,
                  referenceContext: 'content'
                }
              },
              update: {},
              create: {
                mediaId: publicId,
                contentType: 'newsletter',
                contentId: newsletter.id,
                referenceContext: 'content'
              }
            });
          } catch (error) {
            logWarning(`Could not create newsletter reference for ${publicId}: ${error.message}`);
          }
        }
        
        totalReferences += references.length;
      }
    }
    
    logSuccess(`Processed ${newsletters.length} newsletters, found ${totalReferences} references`);
    
  } catch (error) {
    logWarning(`Newsletter extraction failed (table may not exist): ${error.message}`);
  }
}

// Extract references from podcasts
async function extractPodcastReferences() {
  logInfo('Extracting references from podcasts...');
  
  try {
    const podcasts = await prisma.podcast.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true
      }
    }).catch(() => []);
    
    if (podcasts.length === 0) {
      logInfo('No podcasts found or podcast table does not exist');
      return;
    }
    
    let totalReferences = 0;
    
    for (const podcast of podcasts) {
      const references = [];
      
      // Extract from description
      if (podcast.description) {
        const descRefs = extractImageReferences(podcast.description);
        references.push(...descRefs);
      }
      
      // Add thumbnail if it exists
      if (podcast.thumbnail) {
        references.push(podcast.thumbnail);
      }
      
      const uniqueReferences = [...new Set(references)];
      
      if (uniqueReferences.length > 0) {
        logInfo(`Podcast "${podcast.title}": Found ${uniqueReferences.length} references`);
        
        for (const publicId of uniqueReferences) {
          try {
            await prisma.mediaReference.upsert({
              where: {
                mediaId_contentType_contentId_referenceContext: {
                  mediaId: publicId,
                  contentType: 'podcast',
                  contentId: podcast.id,
                  referenceContext: podcast.thumbnail === publicId ? 'thumbnail' : 'content'
                }
              },
              update: {},
              create: {
                mediaId: publicId,
                contentType: 'podcast',
                contentId: podcast.id,
                referenceContext: podcast.thumbnail === publicId ? 'thumbnail' : 'content'
              }
            });
          } catch (error) {
            logWarning(`Could not create podcast reference for ${publicId}: ${error.message}`);
          }
        }
        
        totalReferences += uniqueReferences.length;
      }
    }
    
    logSuccess(`Processed ${podcasts.length} podcasts, found ${totalReferences} references`);
    
  } catch (error) {
    logWarning(`Podcast extraction failed (table may not exist): ${error.message}`);
  }
}

// Create media file records for referenced images
async function createMissingMediaRecords() {
  logInfo('Creating missing media file records...');
  
  try {
    // Get all unique media IDs from references
    const references = await prisma.mediaReference.findMany({
      select: { mediaId: true },
      distinct: ['mediaId']
    });
    
    let createdRecords = 0;
    
    for (const ref of references) {
      const publicId = ref.mediaId;
      
      // Check if media file record exists
      const existingMedia = await prisma.mediaFile.findUnique({
        where: { publicId }
      });
      
      if (!existingMedia) {
        try {
          // Create a placeholder media record
          // In a real scenario, you'd fetch metadata from Cloudinary
          await prisma.mediaFile.create({
            data: {
              publicId,
              url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`,
              filename: publicId.split('/').pop() || 'unknown',
              size: 0, // Would need to fetch from Cloudinary
              format: 'jpg', // Default, would need to detect
              folder: publicId.includes('/') ? publicId.split('/')[0] : 'uploads',
              uploadedAt: new Date(),
              metadata: {}
            }
          });
          
          createdRecords++;
          logInfo(`Created media record for ${publicId}`);
          
        } catch (error) {
          logWarning(`Could not create media record for ${publicId}: ${error.message}`);
        }
      }
    }
    
    logSuccess(`Created ${createdRecords} missing media file records`);
    
  } catch (error) {
    logError(`Failed to create missing media records: ${error.message}`);
  }
}

// Generate summary report
async function generateSummaryReport() {
  logInfo('Generating summary report...');
  
  try {
    const mediaCount = await prisma.mediaFile.count();
    const referenceCount = await prisma.mediaReference.count();
    
    const referenceCounts = await prisma.mediaReference.groupBy({
      by: ['contentType'],
      _count: { id: true }
    });
    
    const orphanedMedia = await prisma.mediaFile.findMany({
      where: {
        references: {
          none: {}
        }
      }
    });
    
    log('\n📊 Media References Summary Report', 'cyan');
    log('==================================\n', 'cyan');
    
    logInfo(`Total media files: ${mediaCount}`);
    logInfo(`Total references: ${referenceCount}`);
    logInfo(`Orphaned files: ${orphanedMedia.length}`);
    
    log('\nReferences by content type:', 'blue');
    for (const count of referenceCounts) {
      log(`  ${count.contentType}: ${count._count.id}`, 'blue');
    }
    
    if (orphanedMedia.length > 0) {
      log('\nOrphaned files (first 10):', 'yellow');
      orphanedMedia.slice(0, 10).forEach(media => {
        log(`  ${media.filename} (${media.publicId})`, 'yellow');
      });
      
      if (orphanedMedia.length > 10) {
        log(`  ... and ${orphanedMedia.length - 10} more`, 'yellow');
      }
    }
    
    log('');
    
  } catch (error) {
    logError(`Failed to generate summary report: ${error.message}`);
  }
}

// Main extraction process
async function runExtraction() {
  log('\n🔍 Media References Extraction', 'cyan');
  log('==============================\n', 'cyan');
  
  try {
    await extractArticleReferences();
    await extractNewsletterReferences();
    await extractPodcastReferences();
    await createMissingMediaRecords();
    await generateSummaryReport();
    
    logSuccess('Media references extraction completed!');
    
  } catch (error) {
    logError(`Extraction failed: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Command line options
const args = process.argv.slice(2);
const options = {
  articlesOnly: args.includes('--articles-only'),
  newslettersOnly: args.includes('--newsletters-only'),
  podcastsOnly: args.includes('--podcasts-only'),
  skipMissingRecords: args.includes('--skip-missing-records'),
  dryRun: args.includes('--dry-run')
};

// Run extraction if called directly
if (require.main === module) {
  if (options.dryRun) {
    logWarning('DRY RUN MODE - No changes will be made to the database');
  }
  
  runExtraction().catch(error => {
    logError(`Extraction failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runExtraction,
  extractImageReferences,
  extractArticleReferences,
  extractNewsletterReferences,
  extractPodcastReferences,
  createMissingMediaRecords,
  generateSummaryReport
};