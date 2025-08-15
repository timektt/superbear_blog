'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/hooks/useToast';

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface CampaignFormData {
  title: string;
  subject: string;
  templateId: string;
  scheduledAt: string;
  recipientFilter: {
    status: string[];
    subscribedAfter: string;
    subscribedBefore: string;
  };
}

export default function CampaignForm() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    subject: '',
    templateId: '',
    scheduledAt: '',
    recipientFilter: {
      status: ['ACTIVE'],
      subscribedAfter: '',
      subscribedBefore: '',
    },
  });
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [recipientCount, setRecipientCount] = useState<number>(0);
  const [isScheduled, setIsScheduled] = useState(false);

  // Fetch email templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/admin/email-templates');
        if (!response.ok) throw new Error('Failed to fetch templates');
        
        const data = await response.json();
        setTemplates(data.templates || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
        showToast('Failed to load email templates', 'error');
      } finally {
        setTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, [showToast]);

  // Update recipient count when filter changes
  useEffect(() => {
    const updateRecipientCount = async () => {
      try {
        const params = new URLSearchParams();
        if (formData.recipientFilter.status.length > 0) {
          formData.recipientFilter.status.forEach(status => {
            params.append('status', status);
          });
        }
        if (formData.recipientFilter.subscribedAfter) {
          params.append('subscribedAfter', formData.recipientFilter.subscribedAfter);
        }
        if (formData.recipientFilter.subscribedBefore) {
          params.append('subscribedBefore', formData.recipientFilter.subscribedBefore);
        }

        const response = await fetch(`/api/admin/newsletter?count=true&${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setRecipientCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching recipient count:', error);
      }
    };

    updateRecipientCount();
  }, [formData.recipientFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilterChange = (filterName: keyof CampaignFormData['recipientFilter'], value: any) => {
    setFormData(prev => ({
      ...prev,
      recipientFilter: {
        ...prev.recipientFilter,
        [filterName]: value,
      },
    }));
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      recipientFilter: {
        ...prev.recipientFilter,
        status: checked
          ? [...prev.recipientFilter.status, status]
          : prev.recipientFilter.status.filter(s => s !== status),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent, sendNow = false) => {
    e.preventDefault();
    
    if (!formData.title || !formData.subject || !formData.templateId) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!sendNow && isScheduled && !formData.scheduledAt) {
      showToast('Please select a scheduled date and time', 'error');
      return;
    }

    if (isScheduled && formData.scheduledAt && new Date(formData.scheduledAt) <= new Date()) {
      showToast('Scheduled time must be in the future', 'error');
      return;
    }

    try {
      setLoading(true);

      // Create campaign
      const campaignData = {
        title: formData.title,
        subject: formData.subject,
        templateId: formData.templateId,
        scheduledAt: isScheduled ? formData.scheduledAt : undefined,
        recipientFilter: {
          status: formData.recipientFilter.status,
          subscribedAfter: formData.recipientFilter.subscribedAfter || undefined,
          subscribedBefore: formData.recipientFilter.subscribedBefore || undefined,
        },
      };

      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create campaign');
      }

      const result = await response.json();
      const campaignId = result.campaignId;

      // If sending now, send the campaign immediately
      if (sendNow) {
        const sendResponse = await fetch(`/api/admin/campaigns/${campaignId}/send`, {
          method: 'POST',
        });

        if (!sendResponse.ok) {
          const error = await sendResponse.json();
          throw new Error(error.error || 'Failed to send campaign');
        }

        showToast('Campaign created and sent successfully!', 'success');
      } else {
        showToast(
          isScheduled 
            ? 'Campaign created and scheduled successfully!' 
            : 'Campaign created successfully!', 
          'success'
        );
      }

      router.push('/admin/campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
      showToast(error instanceof Error ? error.message : 'Failed to create campaign', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Email Campaign</h1>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
        {/* Campaign Details */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Campaign Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Campaign Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Weekly Tech Digest - January 2024"
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="🚀 Your Weekly Tech Update"
                required
              />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Template *
            </label>
            {templatesLoading ? (
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 rounded-md"></div>
            ) : (
              <select
                id="templateId"
                name="templateId"
                value={formData.templateId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.category})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Scheduling */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Scheduling</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="sendNow"
                name="scheduling"
                checked={!isScheduled}
                onChange={() => setIsScheduled(false)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="sendNow" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Send immediately after creation
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="schedule"
                name="scheduling"
                checked={isScheduled}
                onChange={() => setIsScheduled(true)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="schedule" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Schedule for later
              </label>
            </div>

            {isScheduled && (
              <div className="ml-7">
                <input
                  type="datetime-local"
                  id="scheduledAt"
                  name="scheduledAt"
                  value={formData.scheduledAt}
                  onChange={handleInputChange}
                  min={getMinDateTime()}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Recipient Filters */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recipients ({recipientCount.toLocaleString()})
          </h2>
          
          <div className="space-y-6">
            {/* Subscription Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subscription Status
              </label>
              <div className="space-y-2">
                {['ACTIVE', 'PENDING'].map((status) => (
                  <div key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`status-${status}`}
                      checked={formData.recipientFilter.status.includes(status)}
                      onChange={(e) => handleStatusChange(status, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`status-${status}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="subscribedAfter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subscribed After
                </label>
                <input
                  type="date"
                  id="subscribedAfter"
                  value={formData.recipientFilter.subscribedAfter}
                  onChange={(e) => handleFilterChange('subscribedAfter', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="subscribedBefore" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subscribed Before
                </label>
                <input
                  type="date"
                  id="subscribedBefore"
                  value={formData.recipientFilter.subscribedBefore}
                  onChange={(e) => handleFilterChange('subscribedBefore', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : isScheduled ? 'Schedule Campaign' : 'Create & Send'}
          </button>
        </div>
      </form>
    </div>
  );
}