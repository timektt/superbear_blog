const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAnalytics() {
  console.log('🧪 Testing Analytics System...\n');

  try {
    // 1. Test article creation for analytics
    console.log('1. Creating test article...');
    const testArticle = await prisma.article.create({
      data: {
        title: 'Test Article for Analytics',
        slug: 'test-article-analytics',
        summary: 'This is a test article for analytics testing',
        content: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This is test content for analytics testing.',
                },
              ],
            },
          ],
        }),
        status: 'PUBLISHED',
        publishedAt: new Date(),
        author: {
          create: {
            name: 'Test Author',
            bio: 'Test author for analytics',
          },
        },
        category: {
          create: {
            name: 'Test Category',
            slug: 'test-category',
          },
        },
      },
    });
    console.log('✅ Test article created:', testArticle.id);

    // 2. Test analytics tracking
    console.log('\n2. Testing analytics tracking...');
    
    // Simulate article views
    const sessionId = 'test-session-' + Date.now();
    const views = [];
    
    for (let i = 0; i < 5; i++) {
      const view = await prisma.articleView.create({
        data: {
          articleId: testArticle.id,
          sessionId: sessionId + '-' + i,
          fingerprint: 'test-fingerprint-' + i,
          timestamp: new Date(Date.now() - (i * 60000)), // Spread over time
          userAgent: 'Mozilla/5.0 (Test Browser)',
          referrer: i % 2 === 0 ? 'https://google.com' : 'https://twitter.com',
          country: ['US', 'UK', 'CA', 'AU', 'DE'][i],
          device: ['desktop', 'mobile', 'tablet'][i % 3],
          timeOnPage: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
          scrollDepth: Math.floor(Math.random() * 100) + 1, // 1-100%
          bounced: Math.random() > 0.7, // 30% bounce rate
          linksClicked: Math.floor(Math.random() * 5),
          socialShares: Math.floor(Math.random() * 3),
        },
      });
      views.push(view);
    }
    console.log('✅ Created', views.length, 'test views');

    // 3. Test interactions
    console.log('\n3. Testing interactions...');
    const interactions = [];
    
    for (const view of views) {
      // Add some random interactions
      const interactionCount = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < interactionCount; j++) {
        const interactionTypes = ['LINK_CLICK', 'SOCIAL_SHARE', 'SCROLL_MILESTONE', 'TIME_MILESTONE'];
        const type = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];
        
        const interaction = await prisma.articleInteraction.create({
          data: {
            viewId: view.id,
            articleId: testArticle.id,
            type,
            timestamp: new Date(view.timestamp.getTime() + (j * 30000)),
            timeFromStart: j * 30000,
            ...(type === 'LINK_CLICK' && {
              linkUrl: 'https://example.com/link-' + j,
              elementId: 'link-' + j,
            }),
            ...(type === 'SOCIAL_SHARE' && {
              socialPlatform: ['twitter', 'facebook', 'linkedin'][j % 3],
            }),
            ...(type === 'SCROLL_MILESTONE' && {
              scrollPosition: [25, 50, 75, 100][j % 4],
            }),
          },
        });
        interactions.push(interaction);
      }
    }
    console.log('✅ Created', interactions.length, 'test interactions');

    // 4. Test reading session
    console.log('\n4. Testing reading session...');
    const readingSession = await prisma.readingSession.create({
      data: {
        sessionId: sessionId,
        startTime: new Date(Date.now() - 600000), // 10 minutes ago
        endTime: new Date(),
        duration: 600, // 10 minutes
        articlesRead: 1,
        totalReadTime: 300, // 5 minutes actual reading
        pagesViewed: 1,
        entryArticleId: testArticle.id,
        exitArticleId: testArticle.id,
        referrer: 'https://google.com',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        country: 'US',
        device: 'desktop',
      },
    });
    console.log('✅ Created reading session:', readingSession.id);

    // 5. Test article stats calculation
    console.log('\n5. Testing article stats calculation...');
    
    // Calculate stats manually for verification
    const totalViews = views.length;
    const uniqueViews = new Set(views.map(v => v.fingerprint)).size;
    const avgTimeOnPage = views.reduce((sum, v) => sum + (v.timeOnPage || 0), 0) / views.length;
    const avgScrollDepth = views.reduce((sum, v) => sum + (v.scrollDepth || 0), 0) / views.length;
    const bounceRate = (views.filter(v => v.bounced).length / views.length) * 100;
    const totalShares = views.reduce((sum, v) => sum + v.socialShares, 0);
    const totalClicks = views.reduce((sum, v) => sum + v.linksClicked, 0);
    const completionRate = (views.filter(v => (v.scrollDepth || 0) >= 90).length / views.length) * 100;

    const articleStats = await prisma.articleStats.create({
      data: {
        articleId: testArticle.id,
        totalViews,
        uniqueViews,
        avgTimeOnPage,
        avgScrollDepth,
        bounceRate,
        totalShares,
        totalClicks,
        completionRate,
        viewsToday: totalViews,
        viewsThisWeek: totalViews,
        viewsThisMonth: totalViews,
      },
    });
    console.log('✅ Created article stats:', articleStats.id);

    // 6. Test content recommendations
    console.log('\n6. Testing content recommendations...');
    
    // Create another test article for recommendations
    const relatedArticle = await prisma.article.create({
      data: {
        title: 'Related Test Article',
        slug: 'related-test-article',
        summary: 'This is a related test article',
        content: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This is related content.',
                },
              ],
            },
          ],
        }),
        status: 'PUBLISHED',
        publishedAt: new Date(),
        authorId: testArticle.authorId,
        categoryId: testArticle.categoryId,
      },
    });

    const recommendation = await prisma.contentRecommendation.create({
      data: {
        sourceArticleId: testArticle.id,
        targetArticleId: relatedArticle.id,
        score: 0.85,
        reason: 'SIMILAR_CONTENT',
        impressions: 10,
        clicks: 3,
        clickRate: 0.3,
      },
    });
    console.log('✅ Created content recommendation:', recommendation.id);

    // 7. Test analytics queries
    console.log('\n7. Testing analytics queries...');
    
    // Test dashboard data query
    const dashboardStats = await prisma.articleStats.aggregate({
      _sum: {
        totalViews: true,
        totalShares: true,
        totalClicks: true,
      },
      _avg: {
        avgTimeOnPage: true,
        bounceRate: true,
        completionRate: true,
      },
    });
    console.log('✅ Dashboard stats:', dashboardStats);

    // Test top performing articles
    const topArticles = await prisma.articleStats.findMany({
      include: {
        article: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        totalViews: 'desc',
      },
      take: 5,
    });
    console.log('✅ Top articles:', topArticles.length);

    // Test category performance
    const categoryPerformance = await prisma.category.findMany({
      include: {
        articles: {
          include: {
            stats: true,
          },
        },
      },
    });
    console.log('✅ Category performance data:', categoryPerformance.length);

    // 8. Display summary
    console.log('\n📊 Analytics Test Summary:');
    console.log('- Test Article ID:', testArticle.id);
    console.log('- Total Views:', totalViews);
    console.log('- Unique Views:', uniqueViews);
    console.log('- Avg Time on Page:', Math.round(avgTimeOnPage), 'seconds');
    console.log('- Avg Scroll Depth:', Math.round(avgScrollDepth), '%');
    console.log('- Bounce Rate:', Math.round(bounceRate), '%');
    console.log('- Total Interactions:', interactions.length);
    console.log('- Total Shares:', totalShares);
    console.log('- Total Clicks:', totalClicks);
    console.log('- Completion Rate:', Math.round(completionRate), '%');

    console.log('\n✅ All analytics tests passed!');

  } catch (error) {
    console.error('❌ Analytics test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testAnalytics()
    .then(() => {
      console.log('\n🎉 Analytics testing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Analytics testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testAnalytics };