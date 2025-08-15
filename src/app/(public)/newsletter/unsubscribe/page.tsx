import { Suspense } from 'react';
import Link from 'next/link';

interface UnsubscribePageProps {
  searchParams: {
    status?: string;
    email?: string;
    error?: string;
  };
}

function UnsubscribeContent({ searchParams }: UnsubscribePageProps) {
  const { status, email, error } = searchParams;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-6">
              <svg
                className="h-12 w-12 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Oops! Something went wrong
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              {error === 'not_found' && 'We could not find your subscription.'}
              {error === 'server_error' && 'A server error occurred. Please try again later.'}
              {!['not_found', 'server_error'].includes(error) && 'An unexpected error occurred.'}
            </p>

            <div className="space-y-4">
              <Link
                href="/"
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
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
              Successfully Unsubscribed
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              {email ? `${email} has been` : 'You have been'} removed from our newsletter list.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                We're sorry to see you go!
              </h2>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You will no longer receive newsletter emails from SuperBear Blog. 
                You can still visit our website anytime to read the latest articles.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Changed your mind?</strong> You can resubscribe anytime by visiting our homepage.
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/news"
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                Browse Latest Articles
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
                If you have any feedback about why you unsubscribed, we'd love to hear from you.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'already_unsubscribed') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <svg
                className="h-12 w-12 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Already Unsubscribed
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              This email address is already unsubscribed from our newsletter.
            </p>

            <div className="space-y-4">
              <Link
                href="/"
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default unsubscribe form
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Unsubscribe from Newsletter
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            We're sorry to see you go. You can unsubscribe from our newsletter at any time.
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              To unsubscribe, please click the unsubscribe link in any of our newsletter emails, 
              or contact us directly.
            </p>
            
            <div className="space-y-4">
              <Link
                href="/"
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewsletterUnsubscribePage({ searchParams }: UnsubscribePageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <UnsubscribeContent searchParams={searchParams} />
    </Suspense>
  );
}

export const metadata = {
  title: 'Unsubscribe from Newsletter | SuperBear Blog',
  description: 'Unsubscribe from the SuperBear Blog newsletter.',
};