import type { NextConfig } from 'next';

// Safe Sentry import with error handling
let withSentryConfig: any = null;
try {
  withSentryConfig = require('@sentry/nextjs').withSentryConfig;
} catch (error) {
  console.info('Sentry not available, continuing without monitoring');
}

// Bundle analyzer - only enabled for build:analyze command
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tiptap/react',
      '@tiptap/starter-kit',
    ],
    optimizeCss: false, // Temporarily disable CSS optimization
  },

  // External packages for server components
  serverExternalPackages: ['@prisma/client'],

  // Image optimization with Cloudinary loader
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: isProduction ? 31536000 : 60, // 1 year in production, 1 minute in dev
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  trailingSlash: false,

  // Security headers
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      },
    ];

    // Add HSTS only in production
    if (isProduction) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      });
    }

    // Content Security Policy
    if (process.env.ENABLE_CSP === 'true') {
      const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' blob: data: https://res.cloudinary.com https://images.unsplash.com;
        font-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
      `
        .replace(/\s{2,}/g, ' ')
        .trim();

      securityHeaders.push({
        key: 'Content-Security-Policy',
        value: cspHeader,
      });
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Cache static assets
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache public content
      {
        source: '/(news|ai|devtools|open-source|startups|podcasts)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=120, stale-while-revalidate=300',
          },
        ],
      },
      // Cache article pages
      {
        source: '/news/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
      // Cache API responses with compression hints
      {
        source: '/api/articles',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      // Cache search API with compression
      {
        source: '/api/search',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      // No cache for analytics/stats
      {
        source: '/api/(analytics|admin|system)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/articles',
        permanent: false,
      },
      // SEO redirects
      {
        source: '/blog/:path*',
        destination: '/news/:path*',
        permanent: true,
      },
    ];
  },

  // Rewrites for API versioning
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // Webpack configuration for all environments
  webpack: (config, { dev, isServer }) => {
    // Fix for Node.js modules in client-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        url: false,
        querystring: false,
      };

      // Exclude server-only packages from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'cloudinary': 'cloudinary',
        '@prisma/client': '@prisma/client',
      });
    }

    // Development optimizations
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    // Production optimizations - temporarily disabled
    if (!dev && !isServer) {
      // Disable minification to fix webpack error
      config.optimization = {
        ...config.optimization,
        minimize: false,
      };
    }

    return config;
  },

  // Production optimizations - temporarily disabled due to webpack issues
  // ...(isProduction && {
  //   compiler: {
  //     removeConsole: {
  //       exclude: ['error', 'warn'],
  //     },
  //   },

  //   // Optimize bundle
  //   modularizeImports: {
  //     'lucide-react': {
  //       transform: 'lucide-react/dist/esm/icons/{{member}}',
  //     },
  //   },
  // }),

  // Environment-specific configurations
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  },
};

// Apply bundle analyzer
const configWithAnalyzer = withBundleAnalyzer(nextConfig);

// Apply Sentry configuration only if available and properly configured
const finalConfig = (() => {
  // Check if Sentry is available and configured
  const hasSentryConfig = withSentryConfig && 
    process.env.SENTRY_DSN && 
    process.env.SENTRY_ORG && 
    process.env.SENTRY_PROJECT;

  if (isProduction && hasSentryConfig) {
    try {
      return withSentryConfig(configWithAnalyzer, {
        silent: true,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        widenClientFileUpload: true,
        tunnelRoute: '/monitoring',
        sourcemaps: {
          disable: true,
        },
        disableLogger: true,
        automaticVercelMonitors: true,
      });
    } catch (error) {
      console.warn('Failed to configure Sentry, continuing without monitoring:', error.message);
      return configWithAnalyzer;
    }
  }

  return configWithAnalyzer;
})();

export default finalConfig;
