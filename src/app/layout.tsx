import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    default: 'SuperBear Blog - Tech News for Developers',
    template: '%s | SuperBear Blog',
  },
  description:
    'Filtered, in-depth tech content for developers, AI builders, and tech entrepreneurs. Stay updated with AI, DevTools, and startup developments.',
  keywords: [
    'tech news',
    'developer news',
    'AI news',
    'machine learning',
    'developer tools',
    'startup news',
    'programming',
    'software development',
    'tech entrepreneurs',
  ],
  authors: [{ name: 'SuperBear Blog' }],
  creator: 'SuperBear Blog',
  publisher: 'SuperBear Blog',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'SuperBear Blog - Tech News for Developers',
    description:
      'Filtered, in-depth tech content for developers, AI builders, and tech entrepreneurs',
    siteName: 'SuperBear Blog',
    images: [
      {
        url: '/og-default.svg',
        width: 1200,
        height: 630,
        alt: 'SuperBear Blog - Tech News for Developers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SuperBear Blog - Tech News for Developers',
    description:
      'Filtered, in-depth tech content for developers, AI builders, and tech entrepreneurs',
    images: ['/og-default.svg'],
    creator: '@superbear_blog', // Update with actual Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification codes when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [
        { url: '/feed.xml', title: 'SuperBear Blog RSS Feed' },
      ],
    },
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300`}
      >
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
