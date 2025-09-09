'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TemplateCategory, TemplateStatus } from '@prisma/client';
import { useToast } from '@/lib/hooks/useToast';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description?: string;
  category: TemplateCategory;
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string;
  _count: {
    campaigns: number;
    versions: number;
  };
}

interface EmailTemplateListProps {
  onEdit?: (template: EmailTemplate) => void;
  onPreview?: (template: EmailTemplate) => void;
}

export default function EmailTemplateList({
  onEdit,
  onPreview,
}: EmailTemplateListProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    category: '',
    status: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const router = useRouter();
  const { success, error: showError } = useToast();

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filter.category) params.append('category', filter.category);
      if (filter.status) params.append('status', filter.status);

      const response = await fetch(`/api/admin/email-templates?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTemplates(data.templates);
        setPagination(data.pagination);
      } else {
        showError('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      showError('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [pagination.page, filter.category, filter.status]);

  // Delete template
  const handleDelete = async (template: EmailTemplate) => {
    if (template._count.campaigns > 0) {
      showError(
        'Cannot delete template that is being used in campaigns'
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/email-templates/${template.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        success('Template deleted successfully');
        fetchTemplates();
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      showError('Failed to delete template');
    }
  };

  // Duplicate template
  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      const response = await fetch(
        `/api/admin/email-templates/${template.id}/duplicate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${template.name} (Copy)`,
          }),
        }
      );

      if (response.ok) {
        success('Template duplicated successfully');
        fetchTemplates();
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to duplicate template');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      showError('Failed to duplicate template');
    }
  };

  // Get status badge color
  const getStatusColor = (status: TemplateStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get category badge color
  const getCategoryColor = (category: TemplateCategory) => {
    switch (category) {
      case 'NEWSLETTER':
        return 'bg-blue-100 text-blue-800';
      case 'WELCOME':
        return 'bg-purple-100 text-purple-800';
      case 'BREAKING_NEWS':
        return 'bg-red-100 text-red-800';
      case 'DIGEST':
        return 'bg-indigo-100 text-indigo-800';
      case 'PROMOTIONAL':
        return 'bg-orange-100 text-orange-800';
      case 'TRANSACTIONAL':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Email Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your email templates for newsletters and campaigns
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/email-templates/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={filter.category}
              onChange={(e) =>
                setFilter({ ...filter, category: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="NEWSLETTER">Newsletter</option>
              <option value="WELCOME">Welcome</option>
              <option value="BREAKING_NEWS">Breaking News</option>
              <option value="DIGEST">Digest</option>
              <option value="PROMOTIONAL">Promotional</option>
              <option value="TRANSACTIONAL">Transactional</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search templates..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {template.description || 'No description'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}
              >
                {template.category.replace('_', ' ')}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}
              >
                {template.status}
              </span>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              <div className="flex justify-between">
                <span>Campaigns: {template._count.campaigns}</span>
                <span>Versions: {template._count.versions}</span>
              </div>
              <div className="mt-1">
                Updated: {new Date(template.updatedAt).toLocaleDateString()}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit?.(template)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onPreview?.(template)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Preview
              </button>
              <button
                onClick={() => handleDuplicate(template)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Copy
              </button>
              <button
                onClick={() => handleDelete(template)}
                disabled={template._count.campaigns > 0}
                className="px-3 py-2 border border-red-300 rounded text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No email templates found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Get started by creating your first email template.
          </p>
          <button
            onClick={() => router.push('/admin/email-templates/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create Template
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page - 1 })
            }
            disabled={pagination.page === 1}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page + 1 })
            }
            disabled={pagination.page === pagination.pages}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
