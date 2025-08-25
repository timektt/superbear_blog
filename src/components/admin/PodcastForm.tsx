'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/lib/hooks/useToast';
import { z } from 'zod';

const PodcastFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  summary: z.string().max(500).optional(),
  audioUrl: z.string().url('Valid audio URL required'),
  coverImage: z.string().url().optional(),
  duration: z.number().positive().optional(),
  episodeNumber: z.number().positive().optional(),
  seasonNumber: z.number().positive().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  publishedAt: z.date().optional(),
});

type PodcastFormData = z.infer<typeof PodcastFormSchema>;

interface PodcastFormProps {
  podcast?: any;
  onSubmit: (data: PodcastFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PodcastForm({ podcast, onSubmit, onCancel, isLoading = false }: PodcastFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<PodcastFormData>>({
    title: podcast?.title || '',
    slug: podcast?.slug || '',
    description: podcast?.description || '',
    summary: podcast?.summary || '',
    audioUrl: podcast?.audioUrl || '',
    coverImage: podcast?.coverImage || '',
    duration: podcast?.duration || undefined,
    episodeNumber: podcast?.episodeNumber || undefined,
    seasonNumber: podcast?.seasonNumber || 1,
    categoryId: podcast?.categoryId || '',
    tagIds: podcast?.tags?.map((tag: any) => tag.id) || [],
    status: podcast?.status || 'DRAFT',
    publishedAt: podcast?.publishedAt ? new Date(podcast.publishedAt) : undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  useEffect(() => {
    if (formData.title && !podcast) {
      generateSlug(formData.title);
    }
  }, [formData.title, podcast]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const generateSlug = async (title: string) => {
    try {
      const response = await fetch('/api/admin/slugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type: 'podcast' }),
      });
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, slug: data.slug }));
      }
    } catch (error) {
      console.error('Failed to generate slug:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'podcasts');

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, coverImage: data.url }));
        toast({ title: 'Image uploaded successfully' });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({ title: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    try {
      PodcastFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
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
      await onSubmit(formData as PodcastFormData);
      toast({ title: `Podcast ${podcast ? 'updated' : 'created'} successfully` });
    } catch (error) {
      toast({ title: 'Failed to save podcast', variant: 'destructive' });
    }
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds?.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...(prev.tagIds || []), tagId]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {podcast ? 'Edit Podcast Episode' : 'Create New Podcast Episode'}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Saving...' : podcast ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter podcast title"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug *</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="podcast-episode-slug"
                  className={errors.slug ? 'border-red-500' : ''}
                />
                {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Audio URL *</label>
                <Input
                  value={formData.audioUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, audioUrl: e.target.value }))}
                  placeholder="https://example.com/audio.mp3"
                  className={errors.audioUrl ? 'border-red-500' : ''}
                />
                {errors.audioUrl && <p className="text-red-500 text-sm mt-1">{errors.audioUrl}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Episode Number</label>
                  <Input
                    type="number"
                    value={formData.episodeNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, episodeNumber: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Season Number</label>
                  <Input
                    type="number"
                    value={formData.seasonNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, seasonNumber: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
                <Input
                  type="number"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value ? parseInt(e.target.value) : undefined }))}
                  placeholder="1800"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cover Image</label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    disabled={isUploading}
                  />
                  {formData.coverImage && (
                    <div className="relative w-32 h-32">
                      <img
                        src={formData.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  )}
                  {isUploading && <p className="text-sm text-gray-500">Uploading...</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>
              </div>

              {formData.status === 'PUBLISHED' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Publish Date</label>
                  <Input
                    type="datetime-local"
                    value={formData.publishedAt ? formData.publishedAt.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      publishedAt: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Summary</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Brief episode summary (max 500 characters)"
              className="w-full p-3 border rounded-md resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.summary?.length || 0}/500 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed episode description and show notes"
              className="w-full p-3 border rounded-md resize-none"
              rows={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={formData.tagIds?.includes(tag.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleTagToggle(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}