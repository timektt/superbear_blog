'use client';

import { useState, useEffect } from 'react';
import { EmailAuthValidation, EmailCompliance } from '@/lib/email-compliance';

export default function EmailValidationDashboard() {
  const [validationResults, setValidationResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [domain, setDomain] = useState('');

  // Get domain from environment
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SITE_URL || 'https://superbear.blog';
    setDomain(new URL(url).hostname);
  }, []);

  const runValidation = async () => {
    if (!domain) return;

    setLoading(true);
    try {
      const results = await EmailAuthValidation.validateDomainAuth(domain);
      setValidationResults(results);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (valid: boolean) => {
    return valid ? '✅' : '❌';
  };

  const getStatusColor = (valid: boolean) => {
    return valid ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Email Authentication Status
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Validate your domain's email authentication setup
          </p>
        </div>
        <button
          onClick={runValidation}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Domain
        </label>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="example.com"
        />
      </div>

      {validationResults && (
        <div className="space-y-4">
          {/* SPF Record */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {getStatusIcon(validationResults.spf.valid)} SPF Record
              </h3>
              <span
                className={`text-sm font-medium ${getStatusColor(validationResults.spf.valid)}`}
              >
                {validationResults.spf.valid ? 'Valid' : 'Invalid'}
              </span>
            </div>
            {validationResults.spf.record && (
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                {validationResults.spf.record}
              </p>
            )}
            {validationResults.spf.error && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationResults.spf.error}
              </p>
            )}
          </div>

          {/* DKIM Record */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {getStatusIcon(validationResults.dkim.valid)} DKIM Record
              </h3>
              <span
                className={`text-sm font-medium ${getStatusColor(validationResults.dkim.valid)}`}
              >
                {validationResults.dkim.valid ? 'Valid' : 'Invalid'}
              </span>
            </div>
            {validationResults.dkim.selector && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selector: {validationResults.dkim.selector}
              </p>
            )}
            {validationResults.dkim.error && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationResults.dkim.error}
              </p>
            )}
          </div>

          {/* DMARC Record */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {getStatusIcon(validationResults.dmarc.valid)} DMARC Record
              </h3>
              <span
                className={`text-sm font-medium ${getStatusColor(validationResults.dmarc.valid)}`}
              >
                {validationResults.dmarc.valid ? 'Valid' : 'Invalid'}
              </span>
            </div>
            {validationResults.dmarc.policy && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Policy: {validationResults.dmarc.policy}
              </p>
            )}
            {validationResults.dmarc.error && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationResults.dmarc.error}
              </p>
            )}
          </div>
        </div>
      )}

      {/* DNS Setup Instructions */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
          📋 DNS Setup Instructions
        </h3>
        <div className="space-y-3 text-sm">
          <div>
            <strong className="text-blue-800 dark:text-blue-200">
              SPF Record:
            </strong>
            <code className="block mt-1 p-2 bg-blue-100 dark:bg-blue-900/40 rounded text-blue-900 dark:text-blue-100">
              v=spf1 include:_spf.{domain} ~all
            </code>
          </div>
          <div>
            <strong className="text-blue-800 dark:text-blue-200">
              DKIM Record:
            </strong>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Add DKIM selector record provided by your email service provider
            </p>
          </div>
          <div>
            <strong className="text-blue-800 dark:text-blue-200">
              DMARC Record:
            </strong>
            <code className="block mt-1 p-2 bg-blue-100 dark:bg-blue-900/40 rounded text-blue-900 dark:text-blue-100">
              v=DMARC1; p=quarantine; rua=mailto:dmarc@{domain};
              ruf=mailto:dmarc@{domain}; fo=1
            </code>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <h3 className="font-medium text-green-900 dark:text-green-100 mb-3">
          ✅ Email Deliverability Best Practices
        </h3>
        <ul className="text-sm text-green-800 dark:text-green-200 space-y-2">
          <li>• Set up proper SPF, DKIM, and DMARC records</li>
          <li>• Use a dedicated IP address for email sending</li>
          <li>• Maintain a clean subscriber list (remove bounces)</li>
          <li>• Monitor your sender reputation regularly</li>
          <li>• Include clear unsubscribe links in all emails</li>
          <li>• Avoid spam trigger words in subject lines</li>
          <li>• Test emails across different clients before sending</li>
        </ul>
      </div>
    </div>
  );
}
