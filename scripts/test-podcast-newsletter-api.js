const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPodcastNewsletterAPI() {
  console.log('🧪 Testing Podcast and Newsletter API Infrastructure...\n');

  try {
    // Test 1: Check if new models exist in database
    console.log('1. Testing database models...');

    // Test PodcastEpisode model
    const podcastCount = await prisma.podcastEpisode.count();
    console.log(
      `   ✅ PodcastEpisode model accessible (${podcastCount} records)`
    );

    // Test NewsletterIssue model
    const newsletterCount = await prisma.newsletterIssue.count();
    console.log(
      `   ✅ NewsletterIssue model accessible (${newsletterCount} records)`
    );

    // Test 2: Check if relations work
    console.log('\n2. Testing model relations...');

    // Get an author to test relations
    const author = await prisma.author.findFirst();
    if (author) {
      console.log(`   ✅ Author found: ${author.name}`);

      // Test author relations
      const authorWithRelations = await prisma.author.findUnique({
        where: { id: author.id },
        include: {
          articles: true,
          podcasts: true,
          newsletterIssues: true,
        },
      });

      console.log(
        `   ✅ Author relations work - Articles: ${authorWithRelations.articles.length}, Podcasts: ${authorWithRelations.podcasts.length}, Newsletter Issues: ${authorWithRelations.newsletterIssues.length}`
      );
    }

    // Test category relations
    const category = await prisma.category.findFirst();
    if (category) {
      const categoryWithRelations = await prisma.category.findUnique({
        where: { id: category.id },
        include: {
          articles: true,
          podcasts: true,
        },
      });

      console.log(
        `   ✅ Category relations work - Articles: ${categoryWithRelations.articles.length}, Podcasts: ${categoryWithRelations.podcasts.length}`
      );
    }

    // Test 3: Create sample data
    console.log('\n3. Testing data creation...');

    if (author) {
      // Create a test podcast episode
      const testPodcast = await prisma.podcastEpisode.create({
        data: {
          title: 'Test Podcast Episode',
          slug: 'test-podcast-episode-' + Date.now(),
          description: 'This is a test podcast episode',
          audioUrl: 'https://example.com/test-audio.mp3',
          duration: 1800, // 30 minutes
          episodeNumber: 1,
          status: 'DRAFT',
          authorId: author.id,
        },
      });

      console.log(
        `   ✅ Test podcast created: ${testPodcast.title} (ID: ${testPodcast.id})`
      );

      // Create a test newsletter issue
      const testNewsletter = await prisma.newsletterIssue.create({
        data: {
          title: 'Test Newsletter Issue',
          slug: 'test-newsletter-issue-' + Date.now(),
          summary: 'This is a test newsletter issue',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Test content' }],
              },
            ],
          },
          issueNumber: 1,
          status: 'DRAFT',
          authorId: author.id,
        },
      });

      console.log(
        `   ✅ Test newsletter created: ${testNewsletter.title} (ID: ${testNewsletter.id})`
      );

      // Test 4: Query with relations
      console.log('\n4. Testing queries with relations...');

      const podcastWithRelations = await prisma.podcastEpisode.findUnique({
        where: { id: testPodcast.id },
        include: {
          author: true,
          category: true,
          tags: true,
        },
      });

      console.log(`   ✅ Podcast query with relations successful`);
      console.log(`      Author: ${podcastWithRelations.author.name}`);
      console.log(
        `      Category: ${podcastWithRelations.category?.name || 'None'}`
      );
      console.log(`      Tags: ${podcastWithRelations.tags.length}`);

      const newsletterWithRelations = await prisma.newsletterIssue.findUnique({
        where: { id: testNewsletter.id },
        include: {
          author: true,
        },
      });

      console.log(`   ✅ Newsletter query with relations successful`);
      console.log(`      Author: ${newsletterWithRelations.author.name}`);

      // Test 5: Clean up test data
      console.log('\n5. Cleaning up test data...');

      await prisma.podcastEpisode.delete({
        where: { id: testPodcast.id },
      });
      console.log(`   ✅ Test podcast deleted`);

      await prisma.newsletterIssue.delete({
        where: { id: testNewsletter.id },
      });
      console.log(`   ✅ Test newsletter deleted`);
    }

    console.log(
      '\n🎉 All tests passed! Podcast and Newsletter API infrastructure is ready.'
    );
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPodcastNewsletterAPI();
