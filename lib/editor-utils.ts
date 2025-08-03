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
      // Add space between block elements
      if (child.type === 'paragraph' || child.type?.startsWith('heading')) {
        text += ' ';
      }
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

  // Copy allowed attributes
  if (node.text) {
    sanitized.text = node.text;
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
        'plaintext', 'javascript', 'typescript', 'python', 'java', 'cpp', 'c',
        'csharp', 'php', 'ruby', 'go', 'rust', 'html', 'css', 'scss', 'json',
        'xml', 'yaml', 'markdown', 'bash', 'sql'
      ];
      if (allowedLanguages.includes(node.attrs.language)) {
        sanitized.attrs.language = node.attrs.language;
      }
    }
    if (node.type === 'image' && node.attrs.src) {
      // Basic URL validation for images
      try {
        const url = new URL(node.attrs.src);
        // Only allow https URLs and Cloudinary URLs
        if (url.protocol === 'https:' && (url.hostname.includes('cloudinary.com') || url.hostname.includes('res.cloudinary.com'))) {
          sanitized.attrs.src = node.attrs.src;
          if (node.attrs.alt) {
            sanitized.attrs.alt = node.attrs.alt;
          }
          if (node.attrs.title) {
            sanitized.attrs.title = node.attrs.title;
          }
        }
      } catch {
        // Invalid URL, skip this image
        return { type: 'paragraph', content: [] };
      }
    }
  }

  if (node.marks) {
    // Only allow specific marks
    const allowedMarks = ['bold', 'italic', 'strike', 'code', 'link'];
    sanitized.marks = node.marks
      .filter((mark) => allowedMarks.includes(mark.type))
      .map((mark) => {
        if (mark.type === 'link' && mark.attrs?.href) {
          // Basic URL validation
          try {
            new URL(mark.attrs.href);
            return mark;
          } catch {
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
 * Estimates reading time based on editor content
 */
export function estimateReadingTime(content: string | JSONContent): number {
  const text = editorContentToText(content);
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
