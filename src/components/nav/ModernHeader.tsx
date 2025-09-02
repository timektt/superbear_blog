'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, ChevronDown } from 'lucide-react';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';

export default function ModernHeader() {
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
      data-testid="modern-header"
      className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm transition-all duration-300 animate-fade-in-down"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Centered on mobile, left on desktop */}
          <div className="flex-shrink-0 lg:flex-1">
            <Link
              href="/"
              className="inline-flex items-center text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded-lg px-2 py-1"
              aria-label="SuperBear Blog - Home"
            >
              SuperBear
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <nav
            className="hidden lg:block"
            role="navigation"
            aria-label="Main navigation"
          >
            <div className="flex items-center justify-center space-x-2">
              {mainNavigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group ${
                    isActivePage(item.href)
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                  aria-current={isActivePage(item.href) ? 'page' : undefined}
                >
                  {item.label}
                  {isActivePage(item.href) && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                  )}
                </Link>
              ))}

              {/* More Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  id="more-menu-button"
                  onClick={toggleMoreDropdown}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleMoreDropdown();
                    } else if (e.key === 'Escape' && isMoreDropdownOpen) {
                      closeMoreDropdown();
                    } else if (e.key === 'ArrowDown' && isMoreDropdownOpen) {
                      e.preventDefault();
                      // Focus first menu item
                      const firstMenuItem = document.querySelector(
                        '[role="menu"] [role="menuitem"]'
                      ) as HTMLElement;
                      firstMenuItem?.focus();
                    }
                  }}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    moreNavigationItems.some((item) => isActivePage(item.href))
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                  aria-expanded={isMoreDropdownOpen ? 'true' : 'false'}
                  aria-haspopup="menu"
                  aria-label="More navigation options"
                >
                  <span>More</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isMoreDropdownOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {/* Backdrop overlay */}
                {isMoreDropdownOpen && (
                  <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    onClick={closeMoreDropdown}
                    aria-hidden="true"
                  />
                )}

                {/* Dropdown Menu */}
                {isMoreDropdownOpen && (
                  <div
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 py-3 animate-scale-in"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="more-menu-button"
                  >
                    {moreNavigationItems.map((item) => (
                      <div key={item.href} role="none">
                        <Link
                          href={item.href}
                          onClick={closeMoreDropdown}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              closeMoreDropdown();
                              document
                                .getElementById('more-menu-button')
                                ?.focus();
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              const nextItem =
                                e.currentTarget.parentElement?.nextElementSibling?.querySelector(
                                  'a'
                                ) as HTMLElement;
                              nextItem?.focus();
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              const prevItem =
                                e.currentTarget.parentElement?.previousElementSibling?.querySelector(
                                  'a'
                                ) as HTMLElement;
                              prevItem?.focus();
                            }
                          }}
                          className={`block px-6 py-4 text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl mx-2 ${
                            isActivePage(item.href)
                              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                              : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                          role="menuitem"
                          aria-current={
                            isActivePage(item.href) ? 'page' : undefined
                          }
                        >
                          <div className="font-semibold">{item.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {item.description}
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* Search and Theme Toggle - Right Side */}
          <div className="hidden md:flex items-center space-x-4 flex-1 justify-end">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-3 w-64 lg:w-80 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  aria-label="Search articles"
                  role="searchbox"
                  aria-describedby="search-help"
                />
              </div>
            </form>
            <ThemeSwitcher />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            <ThemeSwitcher />
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-3 rounded-full text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-300"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen ? 'true' : 'false'}
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
          className={`md:hidden transition-all duration-500 ease-in-out ${
            isMobileMenuOpen
              ? 'max-h-screen opacity-100 pb-6 animate-slide-in-right'
              : 'max-h-0 opacity-0 overflow-hidden'
          }`}
          id="mobile-menu"
        >
          <div className="px-2 pt-4 space-y-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            {/* Mobile Search */}
            <div className="px-3 py-3">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-6 py-4 w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
                  />
                </div>
              </form>
            </div>

            {/* Mobile Navigation Items */}
            <div className="space-y-1 px-2">
              {allNavigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`block px-6 py-4 rounded-2xl text-base font-medium transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isActivePage(item.href)
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
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
