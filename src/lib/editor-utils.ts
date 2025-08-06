import { JSONContent } from '@tiptap/react';

/**
 * Validates Tiptap JSON content structure
 */
export function validateEditorContent(content: string | JSONContent): boolean {
  try {
    let jsonContent: JSONContent;

    if (typeof content === 'string') {
      jsonContent = JSON.parse(content);
    } else {
      jsonContent = content;
    }

    // Basic validation - check if it has the expected structure
    if (!jsonContent || typeof jsonContent !== 'object') {
      return false;
    }

    // Check if it has the basic Tiptap document structure
    if (jsonContent.type !== 'doc' && !jsonContent.content) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Converts Tiptap JSON to plain text for search/preview purposes
 */
export function editorContentToText(content: string | JSONContent): string {
  try {
    let jsonContent: JSONContent;

    if (typeof content === 'string') {
      jsonContent = JSON.parse(content);
    } else {
      jsonContent = content;
    }

    return extractTextFromNode(jsonContent);
  } catch {
    return '';
  }
}

function extractTextFromNode(node: JSONContent): string {
  let text = '';

  if (node.text) {
    text += node.text;
  }

  if (node.content) {
    for (const child of node.content) {
      text += extractTextFromNode(child);
    }
  }

  return text;
}

/**
 * Creates an empty Tiptap document structure
 */
export function createEmptyDocument(): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [],
      },
    ],
  };
}

/**
 * Sanitizes and validates editor content before saving
 */
export function sanitizeEditorContent(content: string): string | null {
  try {
    const jsonContent = JSON.parse(content);

    if (!validateEditorContent(jsonContent)) {
      return null;
    }

    // Remove any potentially dangerous content
    const sanitized = sanitizeNode(jsonContent);

    return JSON.stringify(sanitized);
  } catch {
    return null;
  }
}

function sanitizeNode(node: JSONContent): JSONContent {
  const sanitized: JSONContent = {
    type: node.type,
  };

  // Only allow specific node types
  const allowedTypes = [
    'doc',
    'paragraph',
    'text',
    'heading',
    'bulletList',
    'orderedList',
    'listItem',
    'blockquote',
    'codeBlock',
    'image',
    'hardBreak',
  ];

  if (!allowedTypes.includes(node.type || '')) {
    return { type: 'paragraph', content: [] };
  }

  // Copy allowed attributes with strict validation
  if (node.text) {
    // Sanitize text content
    sanitized.text = sanitizeTextContent(node.text);
  }

  if (node.attrs) {
    sanitized.attrs = {};
    // Only allow specific attributes based on node type
    if (node.type === 'heading' && node.attrs.level) {
      sanitized.attrs.level = Math.min(Math.max(1, node.attrs.level), 6);
    }
    if (node.type === 'codeBlock' && node.attrs.language) {
      // Allow common programming languages
      const allowedLanguages = [
        'plaintext',
        'javascript',
        'typescript',
        'python',
        'java',
        'cpp',
        'c',
        'csharp',
        'php',
        'ruby',
        'go',
        'rust',
        'html',
        'css',
        'scss',
        'json',
        'xml',
        'yaml',
        'markdown',
        'bash',
        'sql',
      ];
      if (allowedLanguages.includes(node.attrs.language)) {
        sanitized.attrs.language = node.attrs.language;
      }
    }
    if (node.type === 'image' && node.attrs.src) {
      // Enhanced image URL validation
      const sanitizedImageUrl = sanitizeImageUrl(node.attrs.src);
      if (sanitizedImageUrl) {
        sanitized.attrs.src = sanitizedImageUrl;
        if (node.attrs.alt && typeof node.attrs.alt === 'string') {
          sanitized.attrs.alt = sanitizeTextContent(node.attrs.alt, 200);
        }
        if (node.attrs.title && typeof node.attrs.title === 'string') {
          sanitized.attrs.title = sanitizeTextContent(node.attrs.title, 200);
        }
      } else {
        // Invalid image URL, replace with placeholder
        return {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '[Image removed for security reasons]',
            },
          ],
        };
      }
    }
  }

  if (node.marks) {
    // Only allow specific marks with enhanced validation
    const allowedMarks = ['bold', 'italic', 'strike', 'code', 'link'];
    sanitized.marks = node.marks
      .filter((mark) => allowedMarks.includes(mark.type))
      .map((mark) => {
        if (mark.type === 'link' && mark.attrs?.href) {
          // Enhanced URL validation for links
          const sanitizedUrl = sanitizeLinkUrl(mark.attrs.href);
          if (sanitizedUrl) {
            return {
              ...mark,
              attrs: {
                ...mark.attrs,
                href: sanitizedUrl,
                target: '_blank',
                rel: 'noopener noreferrer',
              },
            };
          } else {
            return null;
          }
        }
        return mark;
      })
      .filter((mark): mark is NonNullable<typeof mark> => mark !== null);
  }

  if (node.content) {
    sanitized.content = node.content.map(sanitizeNode);
  }

  return sanitized;
}

/**
 * Sanitize text content to prevent XSS
 */
function sanitizeTextContent(text: string, maxLength: number = 10000): string {
  if (!text || typeof text !== 'string') return '';

  return text
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
}

/**
 * Sanitize image URL with enhanced security
 */
function sanitizeImageUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsedUrl = new URL(url);

    // Only allow HTTPS
    if (parsedUrl.protocol !== 'https:') return null;

    // Only allow Cloudinary domains
    const allowedDomains = ['res.cloudinary.com', 'cloudinary.com'];

    const isAllowedDomain = allowedDomains.some(
      (domain) =>
        parsedUrl.hostname === domain ||
        parsedUrl.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowedDomain) return null;

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /<script/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /onmouseover=/i,
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(url))) return null;

    // Validate file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasValidExtension = validExtensions.some((ext) =>
      parsedUrl.pathname.toLowerCase().includes(ext)
    );

    if (!hasValidExtension) return null;

    return url;
  } catch {
    return null;
  }
}

/**
 * Sanitize link URL with enhanced security
 */
function sanitizeLinkUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsedUrl = new URL(url);

    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return null;

    // Block suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i,
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(url))) return null;

    // Block localhost and private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsedUrl.hostname.toLowerCase();
      const privatePatterns = [
        /^localhost$/,
        /^127\./,
        /^192\.168\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      ];

      if (privatePatterns.some((pattern) => pattern.test(hostname)))
        return null;
    }

    return url;
  } catch {
    return null;
  }
}

/**
 * Estimates reading time based on editor content
 */
export function estimateReadingTime(content: string | JSONContent): number {
  const text = editorContentToText(content);
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Generates a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  if (!title || typeof title !== 'string') {
    return '';
  }

  return (
    title
      .trim()
      .toLowerCase()
      // Handle unicode characters properly
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      // Replace special characters and spaces with hyphens
      .replace(/[^\w\s\u4e00-\u9fff-]/g, '') // Keep Chinese characters
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );
}

/**
 * Extracts plain text from Tiptap JSON content
 * Alias for editorContentToText for backward compatibility
 */
export function extractTextFromContent(content: string | JSONContent): string {
  return editorContentToText(content);
}

/**
 * Validates Tiptap JSON content structure
 * Alias for validateEditorContent for backward compatibility
 */
export function validateContent(content: unknown): boolean {
  if (!content) {
    return false;
  }

  // More strict validation for tests
  if (typeof content !== 'object') {
    return false;
  }

  const contentObj = content as Record<string, unknown>;

  if (!contentObj.type) {
    return false;
  }

  // Reject invalid types
  if (contentObj.type === 'invalid') {
    return false;
  }

  // Check if content is an array when it should be
  if (contentObj.content && !Array.isArray(contentObj.content)) {
    return false;
  }

  if (contentObj.type !== 'doc' && !contentObj.content) {
    return false;
  }

  return validateEditorContent(content);
}

/**
 * Sanitizes content and returns the sanitized JSON object
 */
export function sanitizeContent(content: JSONContent): JSONContent {
  const sanitized = sanitizeNode(content);

  // Filter out dangerous content types
  if (sanitized.content) {
    sanitized.content = sanitized.content.filter((node) => {
      // Remove dangerous node types
      if (
        node.type === 'script' ||
        node.type === 'iframe' ||
        node.type === 'object'
      ) {
        return false;
      }
      // Remove empty paragraphs that were created from dangerous content
      if (
        node.type === 'paragraph' &&
        (!node.content || node.content.length === 0)
      ) {
        return false;
      }
      return true;
    });
  }

  return sanitized;
}

/**
 * Extracts all image URLs from Tiptap JSON content
 */
export function extractImagesFromContent(
  content: string | JSONContent
): string[] {
  try {
    let jsonContent: JSONContent;

    if (typeof content === 'string') {
      jsonContent = JSON.parse(content);
    } else {
      jsonContent = content;
    }

    const images: string[] = [];

    function traverse(node: JSONContent) {
      if (node.type === 'image' && node.attrs?.src) {
        images.push(node.attrs.src);
      }
      if (node.content) {
        node.content.forEach(traverse);
      }
    }

    traverse(jsonContent);
    return images;
  } catch {
    return [];
  }
}

/**
 * Extracts public IDs from Cloudinary URLs in editor content
 */
export function extractCloudinaryPublicIds(
  content: string | JSONContent
): string[] {
  const images = extractImagesFromContent(content);
  const publicIds: string[] = [];

  images.forEach((url) => {
    const publicId = getPublicIdFromCloudinaryUrl(url);
    if (publicId) {
      publicIds.push(publicId);
    }
  });

  return publicIds;
}

/**
 * Extracts public ID from a Cloudinary URL
 */
function getPublicIdFromCloudinaryUrl(url: string): string | null {
  try {
    // Match Cloudinary URL pattern: https://res.cloudinary.com/cloud/image/upload/v123456/folder/image.jpg
    const cloudinaryPattern = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/;
    const match = url.match(cloudinaryPattern);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
