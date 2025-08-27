'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';
import { useEffect, useState } from 'react';

interface ExtendedThemeProviderProps extends ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({
  children,
  ...props
}: ExtendedThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Prevent theme transition flash during initial load
    document.documentElement.classList.add('theme-transition-disable');

    setMounted(true);

    // Re-enable transitions after a short delay
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('theme-transition-disable');
      document.documentElement.classList.add('theme-ready');
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Prevent hydration mismatch and FOIT (Flash of Incorrect Theme)
  if (!mounted) {
    return (
      <div className="theme-loading">
        <div className="min-h-screen bg-background text-foreground">
          {children}
        </div>
      </div>
    );
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      storageKey="superbear-theme"
      enableSystem={true}
      disableTransitionOnChange={false}
      themes={['light', 'dark', 'system']}
      value={{
        light: 'light',
        dark: 'dark',
        system: 'system',
      }}
      {...props}
    >
      <div className="theme-ready">{children}</div>
    </NextThemesProvider>
  );
}
