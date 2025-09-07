import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

// Template safety and injection prevention

export interface TemplateContext {
  [key: string]: any;
}

export interface SafeTemplateOptions {
  allowedVariables?: string[];
  escapeHtml?: boolean;
  removeScripts?: boolean;
  removeIframes?: boolean;
  maxVariableLength?: number;
}

const defaultSafeTemplateOptions: SafeTemplateOptions = {
  allowedVariables: [
    'recipientName',
    'recipientEmail',
    'unsubscribeUrl',
    'campaignTitle',
    'companyName',
    'currentDate',
    'articles',
    'preheader',
  ],
  escapeHtml: true,
  removeScripts: true,
  removeIframes: true,
  maxVariableLength: 1000,
};

// Handlebars-style template variable regex
const TEMPLATE_VARIABLE_REGEX = /\{\{\{?([^}]+)\}?\}\}/g;

// Escape HTML to prevent XSS
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Sanitize template variable name
export function sanitizeVariableName(variableName: string): string {
  // Remove any non-alphanumeric characters except underscore and dot
  return variableName.replace(/[^a-zA-Z0-9_.]/g, '');
}

// Validate template variable
export function isValidTemplateVariable(
  variableName: string,
  allowedVariables?: string[]
): boolean {
  const sanitized = sanitizeVariableName(variableName.trim());

  // Check if variable name is in allowed list
  if (allowedVariables && allowedVariables.length > 0) {
    return allowedVariables.some(
      (allowed) => sanitized === allowed || sanitized.startsWith(`${allowed}.`)
    );
  }

  // Basic validation: must be alphanumeric with underscores/dots
  return /^[a-zA-Z][a-zA-Z0-9_.]*$/.test(sanitized);
}

// Extract template variables from content
export function extractTemplateVariables(content: string): string[] {
  const variables: string[] = [];
  let match;

  while ((match = TEMPLATE_VARIABLE_REGEX.exec(content)) !== null) {
    const variableName = match[1].trim();
    if (variableName && !variables.includes(variableName)) {
      variables.push(variableName);
    }
  }

  return variables;
}

// Validate template content for security
export function validateTemplateContent(
  content: string,
  options: SafeTemplateOptions = defaultSafeTemplateOptions
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  variables: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const variables = extractTemplateVariables(content);

  // Check for script tags
  if (options.removeScripts && /<script[^>]*>.*?<\/script>/gi.test(content)) {
    errors.push('Script tags are not allowed in templates');
  }

  // Check for iframe tags
  if (options.removeIframes && /<iframe[^>]*>.*?<\/iframe>/gi.test(content)) {
    errors.push('Iframe tags are not allowed in templates');
  }

  // Check for dangerous attributes
  const dangerousAttributes = [
    'onload',
    'onerror',
    'onclick',
    'onmouseover',
    'onfocus',
  ];
  for (const attr of dangerousAttributes) {
    if (new RegExp(`\\s${attr}\\s*=`, 'i').test(content)) {
      errors.push(`Dangerous attribute '${attr}' is not allowed`);
    }
  }

  // Validate template variables
  for (const variable of variables) {
    if (!isValidTemplateVariable(variable, options.allowedVariables)) {
      if (options.allowedVariables) {
        errors.push(
          `Template variable '${variable}' is not in the allowed list`
        );
      } else {
        errors.push(
          `Template variable '${variable}' contains invalid characters`
        );
      }
    }
  }

  // Check for potential template injection
  const suspiciousPatterns = [
    /\{\{.*?constructor.*?\}\}/gi,
    /\{\{.*?prototype.*?\}\}/gi,
    /\{\{.*?__proto__.*?\}\}/gi,
    /\{\{.*?eval.*?\}\}/gi,
    /\{\{.*?function.*?\}\}/gi,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      errors.push('Potential template injection detected');
      break;
    }
  }

  // Check template size
  if (content.length > 500000) {
    // 500KB
    warnings.push('Template content is very large and may affect performance');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    variables,
  };
}

// Safely render template with context
export function renderSafeTemplate(
  template: string,
  context: TemplateContext,
  options: SafeTemplateOptions = defaultSafeTemplateOptions
): {
  rendered: string;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate template first
    const validation = validateTemplateContent(template, options);
    if (!validation.isValid) {
      return {
        rendered: template,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }

    // Sanitize context values
    const safeContext: TemplateContext = {};
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string') {
        // Truncate if too long
        let safeValue = value;
        if (
          options.maxVariableLength &&
          value.length > options.maxVariableLength
        ) {
          safeValue = value.substring(0, options.maxVariableLength);
          warnings.push(
            `Variable '${key}' was truncated to ${options.maxVariableLength} characters`
          );
        }

        // Escape HTML if enabled
        if (options.escapeHtml) {
          safeValue = escapeHtml(safeValue);
        }

        safeContext[key] = safeValue;
      } else {
        safeContext[key] = value;
      }
    }

    // Render template
    let rendered = template;

    // Replace template variables
    rendered = rendered.replace(
      TEMPLATE_VARIABLE_REGEX,
      (match, variableName) => {
        const trimmedName = variableName.trim();

        // Check if variable is allowed
        if (!isValidTemplateVariable(trimmedName, options.allowedVariables)) {
          warnings.push(
            `Skipped rendering of invalid variable: ${trimmedName}`
          );
          return match; // Return original if not allowed
        }

        // Get value from context (support dot notation)
        const value = getNestedValue(safeContext, trimmedName);

        if (value === undefined || value === null) {
          warnings.push(`Variable '${trimmedName}' not found in context`);
          return ''; // Replace with empty string
        }

        return String(value);
      }
    );

    // Remove dangerous content if options are set
    if (options.removeScripts) {
      rendered = rendered.replace(/<script[^>]*>.*?<\/script>/gi, '');
    }

    if (options.removeIframes) {
      rendered = rendered.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
    }

    return {
      rendered,
      errors,
      warnings,
    };
  } catch (error) {
    logger.error('Template rendering failed', error as Error);
    return {
      rendered: template,
      errors: [
        `Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      warnings,
    };
  }
}

// Get nested value from object using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// Generate template hash for integrity checking
export function generateTemplateHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

// Verify template integrity
export function verifyTemplateIntegrity(
  content: string,
  expectedHash: string
): boolean {
  const actualHash = generateTemplateHash(content);
  return actualHash === expectedHash;
}

// Create safe template context for campaigns
export function createCampaignTemplateContext(
  campaign: any,
  recipient: any,
  articles: any[] = []
): TemplateContext {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://superbear.blog';

  return {
    recipientName: recipient.name || 'Subscriber',
    recipientEmail: recipient.email,
    campaignTitle: campaign.title || 'Newsletter',
    companyName: 'SuperBear Blog',
    currentDate: new Date().toLocaleDateString(),
    unsubscribeUrl: `${baseUrl}/api/newsletter/unsubscribe?token=${recipient.id}`,
    preheader: campaign.preheader || '',
    articles: articles.map((article) => ({
      title: article.title,
      excerpt: article.excerpt,
      url: `${baseUrl}/news/${article.slug}`,
      publishedAt: article.publishedAt,
      category: article.category?.name,
      author: article.author?.name,
    })),
  };
}

// Whitelist of safe HTML tags for email templates
export const SAFE_HTML_TAGS = [
  'a',
  'b',
  'strong',
  'i',
  'em',
  'u',
  'br',
  'p',
  'div',
  'span',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'table',
  'tr',
  'td',
  'th',
  'thead',
  'tbody',
  'img',
  'blockquote',
  'hr',
];

// Whitelist of safe HTML attributes
export const SAFE_HTML_ATTRIBUTES = [
  'href',
  'src',
  'alt',
  'title',
  'width',
  'height',
  'style',
  'class',
  'id',
  'target',
  'rel',
  'border',
  'cellpadding',
  'cellspacing',
];

// Sanitize HTML content
export function sanitizeHtmlContent(html: string): string {
  // This is a basic implementation. In production, use a library like DOMPurify
  let sanitized = html;

  // Remove script tags
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');

  // Remove dangerous attributes
  const dangerousAttributes = [
    'onload',
    'onerror',
    'onclick',
    'onmouseover',
    'onfocus',
    'onblur',
  ];
  for (const attr of dangerousAttributes) {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(regex, '');
  }

  return sanitized;
}
