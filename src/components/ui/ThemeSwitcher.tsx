'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Check } from 'lucide-react';

interface ThemeSwitcherProps {
  variant?: 'button' | 'dropdown';
  className?: string;
}

export default function ThemeSwitcher({
  variant = 'button',
  className = '',
}: ThemeSwitcherProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme, resolvedTheme, themes } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="p-2 w-9 h-9 rounded-lg bg-muted animate-pulse" />;
  }

  const themeOptions = [
    {
      value: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Light theme',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Dark theme',
    },
    {
      value: 'system',
      label: 'System',
      icon: Monitor,
      description: 'Follow system preference',
    },
  ];

  const currentTheme = themeOptions.find((option) => option.value === theme);
  const CurrentIcon = currentTheme?.icon || Monitor;

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const handleThemeSelect = (selectedTheme: string) => {
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent, themeValue: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleThemeSelect(themeValue);
    }
  };

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={cycleTheme}
        className={`p-2 rounded-lg bg-background hover:bg-muted/50 text-foreground hover:text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${className}`}
        aria-label={`Current theme: ${currentTheme?.label}. Click to cycle themes.`}
        title={`Switch theme (current: ${currentTheme?.label})`}
      >
        <CurrentIcon className="w-5 h-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={(e) => {
          // Close dropdown when focus leaves the component
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsOpen(false);
          }
        }}
        className="flex items-center gap-2 p-2 rounded-lg bg-background hover:bg-muted/50 text-foreground hover:text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        aria-label={`Theme selector. Current theme: ${currentTheme?.label}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <CurrentIcon className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm font-medium">{currentTheme?.label}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-dropdown z-50 py-1"
          role="listbox"
          aria-label="Theme options"
        >
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleThemeSelect(option.value)}
                onKeyDown={(e) => handleKeyDown(e, option.value)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none transition-colors duration-200"
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
              >
                <Icon
                  className="w-4 h-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
