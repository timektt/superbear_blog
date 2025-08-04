import { PrismaClient, Status } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleArticles() {
  console.log('🌱 Creating sample articles...');

  const author = await prisma.author.findFirst();
  const categories = await prisma.category.findMany();
  const tags = await prisma.tag.findMany();

  if (!author || categories.length === 0 || tags.length === 0) {
    console.error('❌ Missing required data. Run seed first.');
    return;
  }

  const sampleArticles = [
    {
      title: 'The Rise of AI-Powered Development Tools',
      slug: 'ai-powered-development-tools',
      summary:
        'Exploring how AI is revolutionizing the way developers write, test, and deploy code.',
      categorySlug: 'devtools',
      tagSlugs: ['ai', 'typescript'],
    },
    {
      title: 'Latest Funding Rounds in AI Startups',
      slug: 'ai-startup-funding-rounds',
      summary:
        'A comprehensive look at recent funding activities in the AI startup ecosystem.',
      categorySlug: 'startups',
      tagSlugs: ['ai', 'funding'],
    },
    {
      title: 'Open Source LLM Models: A Comparison',
      slug: 'open-source-llm-comparison',
      summary:
        'Comparing the latest open source large language models and their capabilities.',
      categorySlug: 'open-source',
      tagSlugs: ['llm', 'ai'],
    },
    {
      title: "Next.js 15: What's New for Developers",
      slug: 'nextjs-15-whats-new',
      summary:
        'Exploring the latest features and improvements in Next.js 15 for modern web development.',
      categorySlug: 'devtools',
      tagSlugs: ['nextjs', 'react', 'typescript'],
    },
    {
      title: 'Y Combinator Winter 2024 Batch Highlights',
      slug: 'yc-winter-2024-highlights',
      summary:
        "Key startups and trends from Y Combinator's latest batch of companies.",
      categorySlug: 'startups',
      tagSlugs: ['yc', 'funding'],
    },
    {
      title: 'Building Scalable AI Applications with TypeScript',
      slug: 'scalable-ai-typescript',
      summary:
        'Best practices for developing robust AI applications using TypeScript and modern frameworks.',
      categorySlug: 'ai-ml',
      tagSlugs: ['ai', 'typescript', 'llm'],
    },
  ];

  for (const articleData of sampleArticles) {
    const category = categories.find(
      (c) => c.slug === articleData.categorySlug
    );
    const articleTags = tags.filter((t) =>
      articleData.tagSlugs.includes(t.slug)
    );

    if (!category) {
      console.warn(`⚠️ Category ${articleData.categorySlug} not found`);
      continue;
    }

    const article = await prisma.article.create({
      data: {
        title: articleData.title,
        slug: articleData.slug,
        summary: articleData.summary,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: `This is the content for "${articleData.title}". Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
                },
              ],
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
                },
              ],
            },
          ],
        },
        status: Status.PUBLISHED,
        publishedAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ), // Random date within last 30 days
        authorId: author.id,
        categoryId: category.id,
        tags: {
          connect: articleTags.map((tag) => ({ id: tag.id })),
        },
      },
    });

    console.log(`✅ Created article: ${article.title}`);
  }

  console.log('🎉 Sample articles created!');
}

createSampleArticles()
  .catch((e) => {
    console.error('❌ Failed to create sample articles:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
