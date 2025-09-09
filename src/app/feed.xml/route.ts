import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // Get the latest published articles
  const articles = await prisma.article.findMany({
    where: {
      status: Status.PUBLISHED,
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: 50, // Limit to latest 50 articles
  });

  const rssItems = articles
    .map((article: any) => {
      const pubDate = article.publishedAt
        ? new Date(article.publishedAt).toUTCString()
        : new Date(article.updatedAt).toUTCString();

      return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <description><![CDATA[${article.summary || `Read ${article.title} by ${article.author.name}`}]]></description>
      <link>${baseUrl}/news/${article.slug}</link>
      <guid isPermaLink="true">${baseUrl}/news/${article.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${article.author.name}</author>
      <category>${article.category.name}</category>
      ${article.image ? `<enclosure url="${article.image}" type="image/jpeg" />` : ''}
    </item>`;
    })
    .join('');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SuperBear Blog - Tech News for Developers</title>
    <description>Filtered, in-depth tech content for developers, AI builders, and tech entrepreneurs</description>
    <link>${baseUrl}</link>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <managingEditor>contact@superbear.blog (SuperBear Blog)</managingEditor>
    <webMaster>contact@superbear.blog (SuperBear Blog)</webMaster>
    <category>Technology</category>
    <category>Software Development</category>
    <category>Artificial Intelligence</category>
    <category>Startups</category>
    <ttl>60</ttl>
    ${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
