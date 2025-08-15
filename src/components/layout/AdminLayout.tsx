'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/admin/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const isActivePage = (href: string) => {
    if (href === '/admin' && pathname === '/admin') return true;
    if (href !== '/admin' && pathname.startsWith(href)) return true;
    return false;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div
            className="text-lg text-gray-700"
            role="status"
            aria-live="polite"
          >
            Loading admin panel...
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/admin/login');
    return null;
  }

  const navigationItems = [
    { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { href: '/admin/articles', label: 'Articles', icon: 'articles' },
    { href: '/admin/categories', label: 'Categories', icon: 'categories' },
    { href: '/admin/tags', label: 'Tags', icon: 'tags' },
    { href: '/admin/newsletter', label: 'Newsletter', icon: 'newsletter' },
    {
      href: '/admin/email-templates',
      label: 'Email Templates',
      icon: 'email-templates',
    },
  ];

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'dashboard':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
            />
          </svg>
        );
      case 'articles':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case 'categories':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
        );
      case 'tags':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
        );
      case 'newsletter':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case 'email-templates':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      <header className="bg-white shadow-sm border-b lg:hidden" role="banner">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                aria-controls="mobile-sidebar"
                aria-expanded={isSidebarOpen}
                aria-label="Toggle sidebar menu"
              >
                <span className="sr-only">Open sidebar</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="ml-4 text-lg font-bold text-gray-900">
                SuperBear Blog Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 hidden sm:block">
                {session.user?.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label="Sign out"
              >
                <span className="hidden sm:inline">Logout</span>
                <svg
                  className="w-5 h-5 sm:hidden"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
          </div>
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-sm transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
          id="mobile-sidebar"
          role="navigation"
          aria-label="Admin navigation"
        >
          {/* Desktop header */}
          <div className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h1 className="text-lg font-bold text-gray-900">
              SuperBear Blog Admin
            </h1>
          </div>

          {/* Mobile close button */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 lg:hidden">
            <h2 className="text-lg font-bold text-gray-900">Menu</h2>
            <button
              type="button"
              onClick={closeSidebar}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-label="Close sidebar"
            >
              <span className="sr-only">Close sidebar</span>
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-6 px-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeSidebar}
                    className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      isActivePage(item.href)
                        ? 'text-indigo-600 bg-indigo-50 border-r-2 border-indigo-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    aria-current={isActivePage(item.href) ? 'page' : undefined}
                  >
                    <span className="mr-3">{getIcon(item.icon)}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User info - Desktop only */}
          <div className="hidden lg:block absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.user?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md"
                aria-label="Sign out"
                title="Sign out"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-0"
          role="main"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
