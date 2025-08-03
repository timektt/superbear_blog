import { PrismaClient, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.adminUser.upsert({
    where: { email: 'admin@superbear.blog' },
    update: {},
    create: {
      email: 'admin@superbear.blog',
      name: 'Admin User',
      password: hashedPassword,
    },
  });
  console.log('✅ Created admin user:', adminUser.email);

  // Create author
  const author = await prisma.author.upsert({
    where: { id: 'author-1' },
    update: {},
    create: {
      id: 'author-1',
      name: 'Tech Writer',
      bio: 'Passionate about AI, DevTools, and startup innovation.',
    },
  });
  console.log('✅ Created author:', author.name);

  // Create categories
  const categories = [
    { name: 'AI & Machine Learning', slug: 'ai-ml' },
    { name: 'DevTools', slug: 'devtools' },
    { name: 'Startups', slug: 'startups' },
    { name: 'Open Source', slug: 'open-source' },
  ];

  for (const categoryData of categories) {
    await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: categoryData,
    });
  }
  console.log('✅ Created categories');

  // Create tags
  const tags = [
    { name: 'AI', slug: 'ai' },
    { name: 'LLM', slug: 'llm' },
    { name: 'React', slug: 'react' },
    { name: 'Next.js', slug: 'nextjs' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'Funding', slug: 'funding' },
    { name: 'YC', slug: 'yc' },
  ];

  for (const tagData of tags) {
    await prisma.tag.upsert({
      where: { slug: tagData.slug },
      update: {},
      create: tagData,
    });
  }
  console.log('✅ Created tags');

  // Create sample article
  const aiCategory = await prisma.category.findUnique({
    where: { slug: 'ai-ml' },
  });
  const aiTag = await prisma.tag.findUnique({ where: { slug: 'ai' } });
  const llmTag = await prisma.tag.findUnique({ where: { slug: 'llm' } });

  if (aiCategory && aiTag && llmTag) {
    const article = await prisma.article.upsert({
      where: { slug: 'welcome-to-superbear-blog' },
      update: {},
      create: {
        title: 'Welcome to SuperBear Blog',
        slug: 'welcome-to-superbear-blog',
        summary: 'Your go-to source for AI, DevTools, and startup insights.',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Welcome to SuperBear Blog, where we dive deep into the latest in AI, developer tools, and startup innovation.',
                },
              ],
            },
          ],
        },
        status: Status.PUBLISHED,
        publishedAt: new Date(),
        authorId: author.id,
        categoryId: aiCategory.id,
      },
    });

    // Connect tags
    await prisma.article.update({
      where: { id: article.id },
      data: {
        tags: {
          connect: [{ id: aiTag.id }, { id: llmTag.id }],
        },
      },
    });
    console.log('✅ Created sample article:', article.title);
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
