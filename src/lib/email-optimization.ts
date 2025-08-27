import juice from 'juice';

// Email optimization utilities
export class EmailOptimizer {
  private static readonly MAX_EMAIL_SIZE = 102 * 1024; // 102KB Gmail limit
  private static readonly WARNING_SIZE = 90 * 1024; // 90KB warning threshold

  // Inline CSS and optimize email
  static async optimizeEmail(html: string): Promise<{
    optimizedHtml: string;
    size: number;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    try {
      // Inline CSS using juice
      let optimizedHtml = juice(html, {
        removeStyleTags: true,
        preserveMediaQueries: true,
        preserveFontFaces: true,
        webResources: {
          images: false, // Don't inline images
          svgs: false,
          scripts: false,
          links: false,
        },
      });

      // Add email client specific fixes
      optimizedHtml = this.addEmailClientFixes(optimizedHtml);

      // Calculate size
      const size = Buffer.byteLength(optimizedHtml, 'utf8');

      // Check size warnings
      if (size > this.MAX_EMAIL_SIZE) {
        warnings.push(
          `Email size (${this.formatBytes(size)}) exceeds Gmail's 102KB limit. Email may be clipped.`
        );
      } else if (size > this.WARNING_SIZE) {
        warnings.push(
          `Email size (${this.formatBytes(size)}) is approaching Gmail's 102KB limit.`
        );
      }

      return {
        optimizedHtml,
        size,
        warnings,
      };
    } catch (error) {
      console.error('Email optimization failed:', error);
      throw new Error('Failed to optimize email template');
    }
  }

  // Add email client specific fixes
  private static addEmailClientFixes(html: string): string {
    // Add Outlook conditional comments and fixes
    let fixedHtml = html;

    // Add viewport meta tag if not present
    if (!html.includes('viewport')) {
      fixedHtml = fixedHtml.replace(
        /<head[^>]*>/i,
        '$&\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
      );
    }

    // Add color scheme for dark mode
    if (!html.includes('color-scheme')) {
      fixedHtml = fixedHtml.replace(
        /<head[^>]*>/i,
        '$&\n    <meta name="color-scheme" content="light dark">\n    <meta name="supported-color-schemes" content="light dark">'
      );
    }

    // Add dark mode CSS
    const darkModeCSS = `
      <style>
        @media (prefers-color-scheme: dark) {
          .dark-mode-bg { background-color: #1a1a1a !important; }
          .dark-mode-text { color: #ffffff !important; }
          .dark-mode-border { border-color: #333333 !important; }
        }
        
        /* Prevent auto-dark mode in email clients */
        [data-ogsc] .dark-mode-bg { background-color: #ffffff !important; }
        [data-ogsc] .dark-mode-text { color: #000000 !important; }
      </style>
    `;

    fixedHtml = fixedHtml.replace('</head>', `${darkModeCSS}\n</head>`);

    return fixedHtml;
  }

  // Format bytes to human readable
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Validate email template
  static validateTemplate(html: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required elements
    if (!html.includes('<!DOCTYPE')) {
      errors.push('Missing DOCTYPE declaration');
    }

    if (!html.includes('<html')) {
      errors.push('Missing HTML tag');
    }

    if (!html.includes('<head>')) {
      errors.push('Missing HEAD section');
    }

    if (!html.includes('<body')) {
      errors.push('Missing BODY tag');
    }

    // Check for problematic elements
    if (html.includes('<script')) {
      errors.push('JavaScript is not allowed in email templates');
    }

    if (
      html.includes('position: fixed') ||
      html.includes('position: absolute')
    ) {
      warnings.push(
        'Fixed/absolute positioning may not work in all email clients'
      );
    }

    if (html.includes('display: flex') || html.includes('display: grid')) {
      warnings.push(
        'Flexbox and Grid may not be supported in older email clients'
      );
    }

    // Check for missing alt attributes on images
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    imgTags.forEach((img) => {
      if (!img.includes('alt=')) {
        warnings.push('Image missing alt attribute for accessibility');
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Email template builder with bulletproof components
export class BulletproofEmailBuilder {
  // Create bulletproof button
  static createButton(
    text: string,
    url: string,
    options: {
      backgroundColor?: string;
      textColor?: string;
      borderRadius?: string;
      padding?: string;
    } = {}
  ): string {
    const {
      backgroundColor = '#2563eb',
      textColor = '#ffffff',
      borderRadius = '6px',
      padding = '12px 24px',
    } = options;

    return `
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:40px;v-text-anchor:middle;width:200px;" arcsize="15%" stroke="f" fillcolor="${backgroundColor}">
        <w:anchorlock/>
        <center style="color:${textColor};font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">
          ${text}
        </center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${url}" style="background-color:${backgroundColor};border:none;border-radius:${borderRadius};color:${textColor};display:inline-block;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;padding:${padding};-webkit-text-size-adjust:none;mso-hide:all;">
        ${text}
      </a>
      <!--<![endif]-->
    `;
  }

  // Create bulletproof table layout
  static createTableLayout(
    content: string,
    options: {
      width?: string;
      backgroundColor?: string;
      padding?: string;
    } = {}
  ): string {
    const {
      width = '600',
      backgroundColor = '#ffffff',
      padding = '20',
    } = options;

    return `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="${width}" style="margin:0 auto;background-color:${backgroundColor};">
        <tr>
          <td style="padding:${padding}px;">
            ${content}
          </td>
        </tr>
      </table>
    `;
  }

  // Create responsive image
  static createResponsiveImage(
    src: string,
    alt: string,
    options: {
      width?: number;
      height?: number;
      retinaSrc?: string;
    } = {}
  ): string {
    const { width = 600, height, retinaSrc } = options;
    const heightAttr = height ? `height="${height}"` : '';

    return `
      <img src="${src}" alt="${alt}" width="${width}" ${heightAttr} style="display:block;width:100%;max-width:${width}px;height:auto;border:0;outline:none;text-decoration:none;" />
      ${
        retinaSrc
          ? `
        <style>
          @media only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min-device-pixel-ratio: 2) {
            .retina-image { content: url('${retinaSrc}') !important; }
          }
        </style>
      `
          : ''
      }
    `;
  }
}
