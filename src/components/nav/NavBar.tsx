'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, ChevronDown } from 'lucide-react';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';

export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleMoreDropdown = () => {
    setIsMoreDropdownOpen(!isMoreDropdownOpen);
  };

  const closeMoreDropdown = () => {
    setIsMoreDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeMoreDropdown();
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
        closeMoreDropdown();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const isActivePage = (href: string) => {
    if (href === '/news' && pathname === '/') return true; // Latest maps to homepage
    if (href !== '/news' && pathname.startsWith(href)) return true;
    return false;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchQuery('');
      closeMobileMenu();
    }
  };

  const mainNavigationItems = [
    { href: '/news', label: 'Latest' },
    { href: '/ai', label: 'AI' },
    { href: '/devtools', label: 'DevTools' },
    { href: '/startups', label: 'Startups' },
  ];

  const moreNavigationItems = [
    {
      href: '/open-source',
      label: 'Open Source',
      description: 'Latest open source projects and tools',
    },
    {
      href: '/podcasts',
      label: 'Podcasts',
      description: 'Tech talks and developer interviews',
    },
    {
      href: '/newsletter',
      label: 'Newsletter',
      description: 'Weekly curated tech insights',
    },
  ];

  const allNavigationItems = [...mainNavigationItems, ...moreNavigationItems];

  return (
    <header
      data-testid="navbar"
      className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm transition-all duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded-md px-1"
              aria-label="SuperBear Blog - Home"
            >
              SuperBear
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <nav
            className="hidden lg:block flex-1"
            role="navigation"
            aria-label="Main navigation"
          >
            <div className="flex items-center justify-center space-x-1">
              {mainNavigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                    isActivePage(item.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-foreground hover:text-primary hover:bg-muted/50'
                  }`}
                  aria-current={isActivePage(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}

              {/* More Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={toggleMoreDropdown}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleMoreDropdown();
                    }
                  }}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                    moreNavigationItems.some((item) => isActivePage(item.href))
                      ? 'text-primary bg-primary/10'
                      : 'text-foreground hover:text-primary hover:bg-muted/50'
                  }`}
                  aria-expanded={isMoreDropdownOpen}
                  aria-haspopup="true"
                  aria-label="More navigation options"
                >
                  <span>More</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isMoreDropdownOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {/* Backdrop overlay */}
                {isMoreDropdownOpen && (
                  <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    onClick={closeMoreDropdown}
                    aria-hidden="true"
                  />
                )}

                {/* Dropdown Menu */}
                {isMoreDropdownOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-64 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg z-50 py-2 animate-slide-down"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    {moreNavigationItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMoreDropdown}
                        className={`block px-4 py-3 text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                          isActivePage(item.href)
                            ? 'text-primary bg-primary/10'
                            : 'text-popover-foreground hover:text-primary hover:bg-muted/50'
                        }`}
                        role="menuitem"
                        aria-current={
                          isActivePage(item.href) ? 'page' : undefined
                        }
                      >
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.description}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* Search and Theme Toggle - Right Side */}
          <div className="hidden md:flex items-center space-x-3">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-48 lg:w-64 text-sm bg-background border border-input rounded-full focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder-muted-foreground transition-all duration-200 hover:bg-muted/50"
                />
              </div>
            </form>
            <ThemeSwitcher />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeSwitcher />
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring transition-all duration-200"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen
              ? 'max-h-96 opacity-100'
              : 'max-h-0 opacity-0 overflow-hidden'
          }`}
          id="mobile-menu"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-border bg-background shadow-lg transition-all duration-200">
            {/* Mobile Search */}
            <div className="px-3 py-2">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-3 w-full text-sm bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder-muted-foreground transition-all duration-200"
                  />
                </div>
              </form>
            </div>

            {/* Mobile Navigation Items */}
            <div className="space-y-1">
              {allNavigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                    isActivePage(item.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-foreground hover:text-primary hover:bg-muted/50'
                  }`}
                  aria-current={isActivePage(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
