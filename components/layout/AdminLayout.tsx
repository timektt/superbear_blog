'use client';

import React from 'react';
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

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/admin/login');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    router.push('/admin/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                SuperBear Blog Admin
              </h1>
            </div>
            <nav className="flex space-x-8">
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/admin'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/articles"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/admin/articles'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Articles
              </Link>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {session.user?.name}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-8">
            <div className="px-4">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin"
                    className={`block px-4 py-2 text-sm rounded-md ${
                      pathname === '/admin'
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/articles"
                    className={`block px-4 py-2 text-sm rounded-md ${
                      pathname === '/admin/articles'
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Articles
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/categories"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Categories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/tags"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Tags
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
