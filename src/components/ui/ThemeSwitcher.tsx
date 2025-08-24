'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Monitor, ChevronDown } from 'lucide-react';

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="p-2 w-9 h-9 rounded-lg bg-muted animate-pulse" />;
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const selectTheme = (newTheme: string) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  const getIcon = (themeValue: string) => {
    if (themeValue === 'system') {
      return <Monitor className="w-4 h-4" aria-hidden="true" />;
    }
    if (themeValue === 'light') {
      return <Sun className="w-4 h-4" aria-hidden="true" />;
    }
    return <Moon className="w-4 h-4" aria-hidden="true" />;
  };

  const getCurrentIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-4 h-4" aria-hidden="true" />;
    }
    return resolvedTheme === 'light' ? (
      <Sun className="w-4 h-4" aria-hidden="true" />
    ) : (
      <Moon className="w-4 h-4" aria-hidden="true" />
    );
  };

  const themes = [
    { value: 'light', label: 'Light', icon: getIcon('light') },
    { value: 'dark', label: 'Dark', icon: getIcon('dark') },
    { value: 'system', label: 'System', icon: getIcon('system') },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center space-x-1 p-2 rounded-lg bg-background hover:bg-muted/50 text-foreground hover:text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        aria-label="Theme selector"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {getCurrentIcon()}
        <ChevronDown 
          className={`w-3 h-3 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-32 bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-lg z-50 py-1 animate-slide-down"
          role="menu"
          aria-orientation="vertical"
        >
          {themes.map((themeOption) => (
            <button
              key={themeOption.value}
              type="button"
              onClick={() => selectTheme(themeOption.value)}
              className={`w-full flex items-center space-x-2 px-3 py-2 text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                theme === themeOption.value
                  ? 'text-primary bg-primary/10'
                  : 'text-card-foreground hover:text-primary hover:bg-muted/50'
              }`}
              role="menuitem"
              aria-current={theme === themeOption.value ? 'true' : undefined}
            >
              {themeOption.icon}
              <span>{themeOption.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}