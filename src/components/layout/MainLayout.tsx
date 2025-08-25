'use client';

import React from 'react';
import NavBar from '@/components/nav/NavBar';
import SiteFooter from '@/components/footer/SiteFooter';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        Skip to main content
      </a>

      {/* Navigation Bar */}
      <header className="bg-header text-header-foreground border-b border-border">
        <NavBar />
      </header>

      {/* Main Content */}
      <main id="main-content" role="main" className="bg-content text-content-foreground">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-surface text-foreground border-t border-border">
        <SiteFooter />
      </footer>
    </div>
  );
}
