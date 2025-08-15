import { prisma } from '@/lib/prisma';
import { TemplateCategory, TemplateStatus } from '@prisma/client';
import Handlebars from 'handlebars';

// Template variable types
export interface TemplateVariables {
  subscriber: {
    name: string;
    email: string;
    subscriptionDate: string;
  };
  articles: {
    featured?: any;
    latest?: any[];
    byCategory?: Record<string, any[]>;
  };
  site: {
    name: string;
    url: string;
    logo: string;
  };
  campaign: {
    subject: string;
    date: string;
    unsubscribeUrl: string;
  };
}

// Default template configurations
export const DEFAULT_DESIGN_CONFIG = {
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    background: '#ffffff',
    text: '#1e293b',
    accent: '#f59e0b'
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif'
  },
  layout: {
    maxWidth: '600px',
    padding: '20px',
    borderRadius: '8px'
  }
};

// Email template compilation
export async function compileTemplate(
  templateId: string,
  variables: Partial<TemplateVariables>
): Promise<{ html: string; text: string; subject: string }> {
  const template = await prisma.emailTemplate.findUnique({
    where: { id: templateId }
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Compile HTML content
  const htmlTemplate = Handlebars.compile(template.htmlContent);
  const html = htmlTemplate(variables);

  // Compile text content (fallback to HTML if no text version)
  let text = '';
  if (template.textContent) {
    const textTemplate = Handlebars.compile(template.textContent);
    text = textTemplate(variables);
  } else {
    // Generate basic text version from HTML
    text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Compile subject
  const subjectTemplate = Handlebars.compile(template.subject);
  const subject = subjectTemplate(variables);

  return { html, text, subject };
}

// Get template by category
export async function getTemplatesByCategory(category: TemplateCategory) {
  return await prisma.emailTemplate.findMany({
    where: {
      category,
      status: TemplateStatus.ACTIVE
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });
}

// Create new template version
export async function createTemplateVersion(
  templateId: string,
  htmlContent: string,
  textContent?: string,
  designConfig?: any
) {
  // Get current version count
  const versionCount = await prisma.templateVersion.count({
    where: { templateId }
  });

  return await prisma.templateVersion.create({
    data: {
      templateId,
      version: versionCount + 1,
      htmlContent,
      textContent,
      designConfig
    }
  });
}

// Default newsletter templates
export const DEFAULT_TEMPLATES = {
  WEEKLY_DIGEST: {
    name: 'Weekly Tech Digest',
    subject: '📰 Your Weekly Tech Update - {{campaign.date}}',
    category: TemplateCategory.NEWSLETTER,
    description: 'Weekly roundup of the latest tech news and articles',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{campaign.subject}}</title>
    <style>
        body { font-family: Inter, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #e2e8f0; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .featured { margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px; }
        .article-grid { margin: 20px 0; }
        .article-item { margin: 15px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 6px; }
        .article-title { font-size: 18px; font-weight: 600; margin: 0 0 8px 0; }
        .article-summary { color: #64748b; margin: 8px 0; }
        .read-more { color: #2563eb; text-decoration: none; font-weight: 500; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{site.name}}</div>
            <p>Your Weekly Tech Update</p>
        </div>
        
        <div class="featured">
            <h2>🌟 Featured This Week</h2>
            {{#if articles.featured}}
            <div class="article-item">
                <h3 class="article-title">{{articles.featured.title}}</h3>
                <p class="article-summary">{{articles.featured.summary}}</p>
                <a href="{{site.url}}/news/{{articles.featured.slug}}" class="read-more">Read More →</a>
            </div>
            {{/if}}
        </div>
        
        <div class="article-grid">
            <h2>📚 Latest Articles</h2>
            {{#each articles.latest}}
            <div class="article-item">
                <h3 class="article-title">{{title}}</h3>
                <p class="article-summary">{{summary}}</p>
                <a href="{{../site.url}}/news/{{slug}}" class="read-more">Read More →</a>
            </div>
            {{/each}}
        </div>
        
        <div class="footer">
            <p>Thanks for reading! 🚀</p>
            <p>
                <a href="{{site.url}}">Visit Website</a> | 
                <a href="{{campaign.unsubscribeUrl}}">Unsubscribe</a>
            </p>
            <p>{{site.name}} - Curated tech news for developers</p>
        </div>
    </div>
</body>
</html>`,
    textContent: `
{{site.name}} - Weekly Tech Update

Hi {{subscriber.name}},

Here's your weekly roundup of the latest tech news:

🌟 FEATURED THIS WEEK
{{#if articles.featured}}
{{articles.featured.title}}
{{articles.featured.summary}}
Read more: {{site.url}}/news/{{articles.featured.slug}}
{{/if}}

📚 LATEST ARTICLES
{{#each articles.latest}}
• {{title}}
  {{summary}}
  {{../site.url}}/news/{{slug}}
{{/each}}

Thanks for reading! 🚀

---
{{site.name}} - Curated tech news for developers
Visit: {{site.url}}
Unsubscribe: {{campaign.unsubscribeUrl}}
`
  },

  BREAKING_NEWS: {
    name: 'Breaking News Alert',
    subject: '🚨 Breaking: {{articles.featured.title}}',
    category: TemplateCategory.BREAKING_NEWS,
    description: 'Urgent news alert template for breaking tech news',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{campaign.subject}}</title>
    <style>
        body { font-family: Inter, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert-header { background: #dc2626; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; border: 2px solid #dc2626; border-top: none; border-radius: 0 0 8px 8px; }
        .article-title { font-size: 24px; font-weight: bold; margin: 0 0 15px 0; color: #dc2626; }
        .article-summary { font-size: 16px; margin: 15px 0; }
        .cta-button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="alert-header">
            <h1>🚨 BREAKING NEWS</h1>
        </div>
        
        <div class="content">
            {{#if articles.featured}}
            <h2 class="article-title">{{articles.featured.title}}</h2>
            <p class="article-summary">{{articles.featured.summary}}</p>
            <a href="{{site.url}}/news/{{articles.featured.slug}}" class="cta-button">Read Full Story</a>
            {{/if}}
        </div>
        
        <div class="footer">
            <p>Stay informed with {{site.name}}</p>
            <p>
                <a href="{{site.url}}">Visit Website</a> | 
                <a href="{{campaign.unsubscribeUrl}}">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>`,
    textContent: `
🚨 BREAKING NEWS - {{site.name}}

{{#if articles.featured}}
{{articles.featured.title}}

{{articles.featured.summary}}

Read the full story: {{site.url}}/news/{{articles.featured.slug}}
{{/if}}

---
Stay informed with {{site.name}}
Visit: {{site.url}}
Unsubscribe: {{campaign.unsubscribeUrl}}
`
  },

  WELCOME: {
    name: 'Welcome Email',
    subject: '👋 Welcome to {{site.name}}, {{subscriber.name}}!',
    category: TemplateCategory.WELCOME,
    description: 'Welcome email for new subscribers',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{campaign.subject}}</title>
    <style>
        body { font-family: Inter, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 30px 0; }
        .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
        .welcome-message { text-align: center; margin: 30px 0; }
        .welcome-title { font-size: 24px; color: #2563eb; margin: 0 0 15px 0; }
        .popular-articles { margin: 30px 0; }
        .article-item { margin: 15px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 6px; }
        .article-title { font-size: 16px; font-weight: 600; margin: 0 0 8px 0; }
        .read-more { color: #2563eb; text-decoration: none; font-weight: 500; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{site.name}}</div>
        </div>
        
        <div class="welcome-message">
            <h1 class="welcome-title">👋 Welcome, {{subscriber.name}}!</h1>
            <p>Thanks for joining our community of tech enthusiasts. You're now part of a growing network of developers, AI builders, and tech entrepreneurs who stay ahead of the curve.</p>
        </div>
        
        <div class="popular-articles">
            <h2>🔥 Popular Articles to Get You Started</h2>
            {{#each articles.latest}}
            <div class="article-item">
                <h3 class="article-title">{{title}}</h3>
                <p>{{summary}}</p>
                <a href="{{../site.url}}/news/{{slug}}" class="read-more">Read Article →</a>
            </div>
            {{/each}}
        </div>
        
        <div class="footer">
            <p>🚀 Ready to dive deeper?</p>
            <p>
                <a href="{{site.url}}">Explore All Articles</a> | 
                <a href="{{site.url}}/ai">AI News</a> | 
                <a href="{{site.url}}/devtools">Dev Tools</a>
            </p>
            <p>
                <a href="{{campaign.unsubscribeUrl}}">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>`,
    textContent: `
Welcome to {{site.name}}!

Hi {{subscriber.name}},

Thanks for joining our community of tech enthusiasts! You're now part of a growing network of developers, AI builders, and tech entrepreneurs.

🔥 POPULAR ARTICLES TO GET YOU STARTED:
{{#each articles.latest}}
• {{title}}
  {{summary}}
  {{../site.url}}/news/{{slug}}
{{/each}}

🚀 Ready to dive deeper?
Explore all articles: {{site.url}}
AI News: {{site.url}}/ai
Dev Tools: {{site.url}}/devtools

---
{{site.name}} - Curated tech news for developers
Unsubscribe: {{campaign.unsubscribeUrl}}
`
  }
};

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', function(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

Handlebars.registerHelper('truncate', function(str: string, length: number) {
  if (str && str.length > length) {
    return str.substring(0, length) + '...';
  }
  return str;
});