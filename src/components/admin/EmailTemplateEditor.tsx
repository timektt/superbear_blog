'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TemplateCategory, TemplateStatus } from '@prisma/client';
import { useToast } from '@/lib/hooks/useToast';
import { DEFAULT_DESIGN_CONFIG } from '@/lib/email-templates';

interface EmailTemplateEditorProps {
  templateId?: string;
  onSave?: () => void;
}

interface TemplateData {
  name: string;
  subject: string;
  description: string;
  category: TemplateCategory;
  status: TemplateStatus;
  htmlContent: string;
  textContent: string;
  designConfig: any;
}

export default function EmailTemplateEditor({ templateId, onSave }: EmailTemplateEditorProps) {
  const [template, setTemplate] = useState<TemplateData>({
    name: '',
    subject: '',
    description: '',
    category: TemplateCategory.NEWSLETTER,
    status: TemplateStatus.DRAFT,
    htmlContent: '',
    textContent: '',
    designConfig: DEFAULT_DESIGN_CONFIG
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');
  const [previewContent, setPreviewContent] = useState('');

  const router = useRouter();
  const { showToast } = useToast();

  // Load template data if editing
  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/email-templates/${templateId}`);
      const data = await response.json();

      if (response.ok) {
        setTemplate({
          name: data.name,
          subject: data.subject,
          description: data.description || '',
          category: data.category,
          status: data.status,
          htmlContent: data.htmlContent,
          textContent: data.textContent || '',
          designConfig: data.designConfig || DEFAULT_DESIGN_CONFIG
        });
      } else {
        showToast('Failed to load template', 'error');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      showToast('Failed to load template', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save template
  const handleSave = async () => {
    if (!template.name.trim() || !template.subject.trim() || !template.htmlContent.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setSaving(true);
      const url = templateId 
        ? `/api/admin/email-templates/${templateId}`
        : '/api/admin/email-templates';
      
      const method = templateId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });

      if (response.ok) {
        showToast(
          templateId ? 'Template updated successfully' : 'Template created successfully',
          'success'
        );
        onSave?.();
        if (!templateId) {
          router.push('/admin/email-templates');
        }
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to save template', 'error');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      showToast('Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Generate preview
  const handlePreview = async () => {
    if (!templateId && !template.htmlContent.trim()) {
      showToast('Please add HTML content first', 'error');
      return;
    }

    try {
      // For new templates, we need to save first to generate preview
      if (!templateId) {
        showToast('Please save the template first to generate preview', 'info');
        return;
      }

      const response = await fetch(`/api/admin/email-templates/${templateId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: previewMode,
          variables: {
            subscriber: { name: 'John Doe' },
            campaign: { subject: template.subject }
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPreviewContent(data.content);
      } else {
        showToast('Failed to generate preview', 'error');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      showToast('Failed to generate preview', 'error');
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {templateId ? 'Edit Template' : 'Create Template'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Design and customize your email template
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePreview}
            disabled={!templateId}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Template Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Weekly Newsletter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  value={template.subject}
                  onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Your Weekly Tech Update - {{campaign.date}}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={template.description}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Brief description of this template"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={template.category}
                    onChange={(e) => setTemplate({ ...template, category: e.target.value as TemplateCategory })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
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
                    value={template.status}
                    onChange={(e) => setTemplate({ ...template, status: e.target.value as TemplateStatus })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* HTML Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              HTML Content *
            </h2>
            <textarea
              value={template.htmlContent}
              onChange={(e) => setTemplate({ ...template, htmlContent: e.target.value })}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              placeholder="Enter your HTML email template here..."
            />
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Available variables:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><code>{'{{subscriber.name}}'}</code> - Subscriber name</li>
                <li><code>{'{{articles.featured}}'}</code> - Featured article</li>
                <li><code>{'{{articles.latest}}'}</code> - Latest articles array</li>
                <li><code>{'{{site.name}}'}</code> - Site name</li>
                <li><code>{'{{campaign.unsubscribeUrl}}'}</code> - Unsubscribe URL</li>
              </ul>
            </div>
          </div>

          {/* Text Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Text Content (Optional)
            </h2>
            <textarea
              value={template.textContent}
              onChange={(e) => setTemplate({ ...template, textContent: e.target.value })}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              placeholder="Plain text version of your email (optional - will be auto-generated if not provided)"
            />
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Preview
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode('html')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    previewMode === 'html'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  HTML
                </button>
                <button
                  onClick={() => setPreviewMode('text')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    previewMode === 'text'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Text
                </button>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-600 rounded-md min-h-[400px] p-4 bg-gray-50 dark:bg-gray-900">
              {previewContent ? (
                previewMode === 'html' ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                    className="prose prose-sm max-w-none"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                    {previewContent}
                  </pre>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  {templateId ? 'Click "Preview" to see your template' : 'Save template first to generate preview'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}