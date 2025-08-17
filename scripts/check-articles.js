const { PrismaClient } = require('@prisma/client');

async function checkArticles() {
  const prisma = new PrismaClient();
  
  try {
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
      },
    });
    
    console.log('Articles in database:', articles.length);
    articles.forEach(article => {
      console.log(`- ${article.title} (${article.slug}) - ${article.status}`);
    });
    
  } catch (error) {
    console.error('Error checking articles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArticles();