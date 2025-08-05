const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAdminStats() {
  try {
    console.log('Testing admin stats API...');
    
    // First, let's check if we have any data in the database
    const articleCount = await prisma.article.count();
    console.log(`Total articles in database: ${articleCount}`);
    
    const categoryCount = await prisma.category.count();
    console.log(`Total categories in database: ${categoryCount}`);
    
    const authorCount = await prisma.author.count();
    console.log(`Total authors in database: ${authorCount}`);
    
    // Test the stats query logic
    const articleStats = await prisma.article.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });
    
    console.log('Article stats by status:', articleStats);
    
    // Get recent activity (articles created in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentArticles = await prisma.article.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });
    
    console.log(`Articles created in last 7 days: ${recentArticles}`);
    
    // Get category distribution
    const categoryStats = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            articles: {
              where: {
                status: 'PUBLISHED',
              },
            },
          },
        },
      },
      orderBy: {
        articles: {
          _count: 'desc',
        },
      },
      take: 5,
    });
    
    console.log('Top categories:', categoryStats);
    
    console.log('Admin stats test completed successfully!');
  } catch (error) {
    console.error('Error testing admin stats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminStats();