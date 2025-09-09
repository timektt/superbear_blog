'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Editor } from '@/components/editor';
import { useToast } from '@/lib/hooks/useToast';
import { z } from 'zod';

const NewsletterIssueFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
  summary: z.string().max(500).optional(),
  content: z.any(), // Tiptap JSON content
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  publishedAt: z.date().optional(),
});

type NewsletterIssueFormData = z.infer<typeof NewsletterIssueFormSchema>;

interface NewsletterIssueFormProps {
  issue?: any;
  onSubmit: (data: NewsletterIssueFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function NewsletterIssueForm({
  issue,
  onSubmit,
  onCancel,
  isLoading = false,
}: NewsletterIssueFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<NewsletterIssueFormData>>({
    title: issue?.title || '',
    slug: issue?.slug || '',
    summary: issue?.summary || '',
    content: issue?.content || null,
    status: issue?.status || 'DRAFT',
    publishedAt: issue?.publishedAt ? new Date(issue.publishedAt) : undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nextIssueNumber, setNextIssueNumber] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!issue) {
      fetchNextIssueNumber();
    }
  }, [issue]);

  useEffect(() => {
    if (formData.title && !issue) {
      generateSlug(formData.title);
    }
  }, [formData.title, issue]);

  // Auto-save functionality
  useEffect(() => {
    if (issue && formData.title) {
      const autoSaveTimer = setTimeout(() => {
        handleAutoSave();
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(autoSaveTimer);
    }
  }, [formData, issue]);

  const fetchNextIssueNumber = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/issues/next-number');
      if (response.ok) {
        const data = await response.json();
        setNextIssueNumber(data.nextNumber);
      }
    } catch (error) {
      console.error('Failed to fetch next issue number:', error);
    }
  };

  const generateSlug = async (title: string) => {
    try {
      const response = await fetch('/api/admin/slugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type: 'newsletter' }),
      });
      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, slug: data.slug }));
      }
    } catch (error) {
      console.error('Failed to generate slug:', error);
    }
  };

  const handleAutoSave = async () => {
    if (!issue || !formData.title || isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/admin/newsletter/issues/${issue.id}/auto-save`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const validateForm = () => {
    try {
      NewsletterIssueFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path && issue.path.length > 0) {
            newErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({ title: 'Please fix validation errors', variant: 'destructive' });
      return;
    }

    try {
      await onSubmit(formData as NewsletterIssueFormData);
      toast({
        title: `Newsletter issue ${issue ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Failed to save newsletter issue',
        variant: 'destructive',
      });
    }
  };

  const handleSchedulePublish = async () => {
    if (!formData.publishedAt) {
      toast({ title: 'Please select a publish date', variant: 'destructive' });
      return;
    }

    const updatedData = { ...formData, status: 'PUBLISHED' as const };
    setFormData(updatedData);

    try {
      await onSubmit(updatedData as NewsletterIssueFormData);
      toast({ title: 'Newsletter issue scheduled for publishing' });
    } catch (error) {
      toast({ title: 'Failed to schedule newsletter', variant: 'destructive' });
    }
  };

  const handleSendNow = async () => {
    if (formData.status !== 'PUBLISHED') {
      toast({
        title: 'Newsletter must be published before sending',
        variant: 'destructive',
      });
      return;
    }

    if (
      !confirm(
        'Are you sure you want to send this newsletter to all subscribers?'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/newsletter/issues/${issue.id}/send`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        toast({ title: 'Newsletter sent successfully' });
        router.push('/admin/newsletter');
      } else {
        throw new Error('Failed to send newsletter');
      }
    } catch (error) {
      toast({ title: 'Failed to send newsletter', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {issue
                ? `Edit Newsletter Issue #${issue.issueNumber}`
                : `Create Newsletter Issue #${nextIssueNumber}`}
            </h1>
            {lastSaved && (
              <p className="text-sm text-gray-500 mt-1">
                Last saved: {lastSaved.toLocaleTimeString()}
                {isSaving && ' (saving...)'}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>

            {formData.status === 'DRAFT' && (
              <Button
                variant="outline"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    status: 'PUBLISHED',
                    publishedAt: new Date(),
                  }))
                }
                disabled={isLoading}
              >
                Publish Now
              </Button>
            )}

            {formData.status === 'PUBLISHED' && issue && !issue.sentAt && (
              <Button
                variant="default"
                onClick={handleSendNow}
                disabled={isLoading}
              >
                Send to Subscribers
              </Button>
            )}

            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Saving...' : issue ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter newsletter title"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug *</label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="newsletter-issue-slug"
                  className={errors.slug ? 'border-red-500' : ''}
                />
                {errors.slug && (
                  <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Summary
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      summary: e.target.value,
                    }))
                  }
                  placeholder="Brief newsletter summary (max 500 characters)"
                  className="w-full p-3 border rounded-md resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.summary?.length || 0}/500 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Content *
                </label>
                <div className="border rounded-md">
                  <Editor
                    content={formData.content}
                    onChange={(content: string) =>
                      setFormData((prev) => ({ ...prev, content }))
                    }
                    placeholder="Write your newsletter content here..."
                  />
                </div>
                {errors.content && (
                  <p className="text-red-500 text-sm mt-1">{errors.content}</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <Card className="p-4">
                <h3 className="font-medium mb-4">Publishing Options</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Status
                    </label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: value as any,
                        }))
                      }
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </Select>
                  </div>

                  {formData.status === 'PUBLISHED' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Publish Date
                      </label>
                      <Input
                        type="datetime-local"
                        value={
                          formData.publishedAt
                            ? formData.publishedAt.toISOString().slice(0, 16)
                            : ''
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            publishedAt: e.target.value
                              ? new Date(e.target.value)
                              : undefined,
                          }))
                        }
                      />

                      {formData.publishedAt &&
                        formData.publishedAt > new Date() && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={handleSchedulePublish}
                          >
                            Schedule for{' '}
                            {formData.publishedAt.toLocaleDateString()}
                          </Button>
                        )}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-4">Issue Information</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Issue Number:</span>
                    <span className="font-medium">
                      #{issue?.issueNumber || nextIssueNumber}
                    </span>
                  </div>

                  {issue?.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span>
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {issue?.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Updated:</span>
                      <span>
                        {new Date(issue.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {issue?.sentAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sent:</span>
                      <span>{new Date(issue.sentAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </Card>

              {formData.status === 'PUBLISHED' && (
                <Card className="p-4">
                  <h3 className="font-medium mb-4">Preview & Send</h3>

                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        window.open(`/newsletter/${formData.slug}`, '_blank')
                      }
                    >
                      Preview Newsletter
                    </Button>

                    {issue && !issue.sentAt && (
                      <Button
                        type="button"
                        variant="default"
                        className="w-full"
                        onClick={handleSendNow}
                      >
                        Send to Subscribers
                      </Button>
                    )}

                    {issue?.sentAt && (
                      <div className="text-center text-sm text-green-600">
                        ✓ Sent to subscribers
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
