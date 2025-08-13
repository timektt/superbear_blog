'use client';

import React from 'react';
import NavBar from '@/components/nav/NavBar';
import SiteFooter from '@/components/footer/SiteFooter';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Navigation Bar */}
      <NavBar />

      {/* Main Content */}
      <main id="main-content" role="main">
        {children}
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
