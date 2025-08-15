import { Suspense } from 'react';
import Link from 'next/link';

function VerifiedContent() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
            <svg
              className="h-12 w-12 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Subscription Confirmed! 🎉
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Thank you for subscribing to the SuperBear Blog newsletter. You'll now receive our latest tech news, AI insights, and developer tools updates.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              What's Next?
            </h2>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 text-left">
              <li className="flex items-start">
                <span className="mr-2">📧</span>
                <span>You'll receive our weekly newsletter with curated content</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🚨</span>
                <span>Breaking news alerts for major tech developments</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🎯</span>
                <span>Personalized content based on your interests</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <Link
              href="/news"
              className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              Explore Latest Articles
            </Link>
            
            <Link
              href="/"
              className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Back to Homepage
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You can{' '}
              <Link
                href="/newsletter/preferences"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                manage your preferences
              </Link>
              {' '}or{' '}
              <Link
                href="/api/newsletter/unsubscribe"
                className="text-gray-600 dark:text-gray-400 hover:underline"
              >
                unsubscribe
              </Link>
              {' '}at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewsletterVerifiedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifiedContent />
    </Suspense>
  );
}

export const metadata = {
  title: 'Newsletter Subscription Confirmed | SuperBear Blog',
  description: 'Your newsletter subscription has been confirmed. Thank you for joining the SuperBear Blog community!',
};