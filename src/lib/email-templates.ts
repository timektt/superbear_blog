import { prisma } from '@/lib/prisma';
import { TemplateCategory, TemplateStatus } from '@prisma/client';
import Handlebars from 'handlebars';
import { EmailOptimizer } from './email-optimization';
import { EmailCompliance } from './email-compliance';

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

// Email template compilation with optimization
export async function compileTemplate(
  templateId: string,
  variables: Partial<TemplateVariables>,
  subscriberEmail?: string
): Promise<{ 
  html: string; 
  text: string; 
  subject: string; 
  preheader: string;
  size: number;
  warnings: string[];
  headers: Record<string, string>;
}> {
  const template = await prisma.emailTemplate.findUnique({
    where: { id: templateId }
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Compile HTML content
  const htmlTemplate = Handlebars.compile(template.htmlContent);
  let html = htmlTemplate(variables);

  // Add preheader to HTML if not present
  const preheader = generatePreheader(template.subject, variables);
  if (!html.includes('preheader')) {
    html = addPreheaderToHtml(html, preheader);
  }

  // Add compliance footer if subscriber email provided
  if (subscriberEmail) {
    html = EmailCompliance.addComplianceFooter(html, subscriberEmail);
  }

  // Optimize email (inline CSS, size check, etc.)
  const optimization = await EmailOptimizer.optimizeEmail(html);
  html = optimization.optimizedHtml;

  // Compile text content (fallback to HTML if no text version)
  let text = '';
  if (template.textContent) {
    const textTemplate = Handlebars.compile(template.textContent);
    text = textTemplate(variables);
  } else {
    // Generate proper text version from HTML
    text = generateTextFromHtml(html);
  }

  // Compile subject
  const subjectTemplate = Handlebars.compile(template.subject);
  const subject = subjectTemplate(variables);

  // Generate email headers
  const headers = subscriberEmail 
    ? EmailCompliance.generateHeaders(templateId, subscriberEmail)
    : {};

  return { 
    html, 
    text, 
    subject, 
    preheader,
    size: optimization.size,
    warnings: optimization.warnings,
    headers
  };
}

// Generate preheader text
function generatePreheader(subject: string, variables: Partial<TemplateVariables>): string {
  const subjectTemplate = Handlebars.compile(subject);
  const compiledSubject = subjectTemplate(variables);
  
  // Create meaningful preheader based on content
  if (variables.articles?.featured) {
    return `${variables.articles.featured.title} and more tech news...`;
  }
  
  return `${compiledSubject} - Stay updated with the latest tech news`;
}

// Add preheader to HTML
function addPreheaderToHtml(html: string, preheader: string): string {
  const preheaderHtml = `
    <!-- Preheader text -->
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
      ${preheader}
    </div>
  `;
  
  // Insert after <body> tag
  return html.replace(/<body[^>]*>/, `$&${preheaderHtml}`);
}

// Generate proper text version from HTML
function generateTextFromHtml(html: string): string {
  return html
    // Remove style and script tags completely
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Convert common HTML elements to text equivalents
    .replace(/<h[1-6][^>]*>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<div[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>/gi, '')
    .replace(/<\/a>/gi, ' ($1)')
    .replace(/<strong[^>]*>|<b[^>]*>/gi, '**')
    .replace(/<\/strong>|<\/b>/gi, '**')
    .replace(/<em[^>]*>|<i[^>]*>/gi, '*')
    .replace(/<\/em>|<\/i>/gi, '*')
    // Remove all other HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
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
  designConfig?: unknown
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
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>{{campaign.subject}}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        /* Reset styles */
        body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        
        /* Base styles */
        body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; height: 100% !important; background-color: #f8fafc; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        
        /* Typography */
        .header-text { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: #2563eb; margin: 0; }
        .body-text { font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1e293b; margin: 0; }
        .small-text { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; color: #64748b; margin: 0; }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .dark-mode-bg { background-color: #1a1a1a !important; }
            .dark-mode-text { color: #ffffff !important; }
            .dark-mode-border { border-color: #333333 !important; }
        }
        
        /* Prevent auto-dark mode in Gmail */
        [data-ogsc] .dark-mode-bg { background-color: #ffffff !important; }
        [data-ogsc] .dark-mode-text { color: #000000 !important; }
        
        /* Mobile responsive */
        @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; }
            .mobile-padding { padding: 10px !important; }
            .mobile-text { font-size: 14px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
    <!-- Preheader text -->
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        {{#if articles.featured}}{{articles.featured.title}} and more tech news...{{else}}Your weekly tech update from {{site.name}}{{/if}}
    </div>
    
    <!-- Email container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table class="email-container dark-mode-bg" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px 20px; border-bottom: 2px solid #e2e8f0;" class="dark-mode-border">
                            <h1 class="header-text dark-mode-text">{{site.name}}</h1>
                            <p class="body-text dark-mode-text" style="margin-top: 10px;">Your Weekly Tech Update</p>
                        </td>
                    </tr>
                    
                    <!-- Featured Article -->
                    {{#if articles.featured}}
                    <tr>
                        <td style="padding: 30px 20px;" class="mobile-padding">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; padding: 20px;">
                                <tr>
                                    <td>
                                        <h2 class="body-text dark-mode-text" style="font-size: 20px; font-weight: bold; margin: 0 0 15px 0;">🌟 Featured This Week</h2>
                                        <h3 class="body-text dark-mode-text" style="font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">{{articles.featured.title}}</h3>
                                        <p class="body-text dark-mode-text" style="margin: 0 0 15px 0;">{{articles.featured.summary}}</p>
                                        
                                        <!-- Bulletproof button -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="border-radius: 6px; background-color: #2563eb;">
                                                    <!--[if mso]>
                                                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{../site.url}}/news/{{slug}}" style="height:40px;v-text-anchor:middle;width:150px;" arcsize="15%" stroke="f" fillcolor="#2563eb">
                                                        <w:anchorlock/>
                                                        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">
                                                            Read More
                                                        </center>
                                                    </v:roundrect>
                                                    <![endif]-->
                                                    <!--[if !mso]><!-->
                                                    <a href="{{../site.url}}/news/{{slug}}" style="background-color:#2563eb;border:none;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;padding:0 20px;-webkit-text-size-adjust:none;mso-hide:all;">
                                                        Read More →
                                                    </a>
                                                    <!--<![endif]-->
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    {{/if}}
                    
                    <!-- Latest Articles -->
                    <tr>
                        <td style="padding: 20px;" class="mobile-padding">
                            <h2 class="body-text dark-mode-text" style="font-size: 20px; font-weight: bold; margin: 0 0 20px 0;">📚 Latest Articles</h2>
                            
                            {{#each articles.latest}}
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px;" class="dark-mode-border">
                                <tr>
                                    <td>
                                        <h3 class="body-text dark-mode-text" style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">{{title}}</h3>
                                        <p class="small-text" style="margin: 0 0 10px 0;">{{summary}}</p>
                                        <a href="{{../site.url}}/news/{{slug}}" style="color: #2563eb; text-decoration: none; font-weight: 500; font-family: Arial, sans-serif; font-size: 14px;">Read More →</a>
                                    </td>
                                </tr>
                            </table>
                            {{/each}}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 40px 20px; border-top: 1px solid #e2e8f0;" class="dark-mode-border">
                            <p class="small-text dark-mode-text" style="margin: 0 0 10px 0;">Thanks for reading! 🚀</p>
                            <p class="small-text" style="margin: 0;">
                                <a href="{{site.url}}" style="color: #2563eb; text-decoration: none;">Visit Website</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
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