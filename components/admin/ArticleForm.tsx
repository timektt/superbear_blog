'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Editor } from '@/components/editor/Editor';
import { useEditorState } from '@/components/editor/useEditor';
import ImageUploader from '@/components/admin/ImageUploader';
import {
  articleFormSchema,
  type ArticleFormData,
  generateSlugFromTitle,
  validateSlug,
} from '@/lib/validations/article';
import { createEmptyDocument } from '@/lib/editor-utils';

interface Author {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface ArticleFormProps {
  initialData?: Partial<ArticleFormData> & {
    id?: string;
    tags?: Tag[];
  };
  mode: 'create' | 'edit';
}

export default function ArticleForm({ initialData, mode }: ArticleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Form state
  const [formData, setFormData] = useState<ArticleFormData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    summary: initialData?.summary || '',
    content: initialData?.content || JSON.stringify(createEmptyDocument()),
    image: initialData?.image || '',
    status: initialData?.status || 'DRAFT',
    authorId: initialData?.authorId || '',
    categoryId: initialData?.categoryId || '',
    tagIds: initialData?.tags?.map((tag) => tag.id) || [],
  });

  const [imagePublicId, setImagePublicId] = useState<string>('');

  // TODO: Use imagePublicId for image deletion when removing images

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  // Editor state
  const {
    content: editorContent,
    isValid: isEditorValid,
    error: editorError,
    handleContentChange,
  } = useEditorState({
    initialContent: formData.content,
    required: true,
  });

  // Fetch form options
  useEffect(() => {
    const fetchFormOptions = async () => {
      try {
        const [authorsRes, categoriesRes, tagsRes] = await Promise.all([
          fetch('/api/admin/authors'),
          fetch('/api/admin/categories'),
          fetch('/api/admin/tags'),
        ]);

        if (authorsRes.ok) {
          const authorsData = await authorsRes.json();
          setAuthors(authorsData.authors || []);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.categories || []);
        }

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setTags(tagsData.tags || []);
        }
      } catch (error) {
        console.error('Failed to fetch form options:', error);
        setError('Failed to load form options');
      }
    };

    fetchFormOptions();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited && formData.title) {
      const generatedSlug = generateSlugFromTitle(formData.title);
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, slugManuallyEdited]);

  // Update editor content in form data
  useEffect(() => {
    setFormData((prev) => ({ ...prev, content: editorContent }));
  }, [editorContent]);

  const handleInputChange = (
    field: keyof ArticleFormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setSlugError(null);

    if (value && !validateSlug(value)) {
      setSlugError(
        'Slug can only contain lowercase letters, numbers, and hyphens'
      );
    }

    handleInputChange('slug', value);
  };

  const handleTagToggle = (tagId: string) => {
    const currentTags = formData.tagIds;
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((id) => id !== tagId)
      : [...currentTags, tagId];

    handleInputChange('tagIds', newTags);
  };

  const handleImageUpload = (imageUrl: string, publicId: string) => {
    setFormData((prev) => ({ ...prev, image: imageUrl }));
    setImagePublicId(publicId);
  };

  const handleImageRemove = () => {
    setFormData((prev) => ({ ...prev, image: '' }));
    setImagePublicId('');
  };

  const validateForm = (): boolean => {
    try {
      articleFormSchema.parse(formData);
      return isEditorValid && !slugError;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please fix all validation errors before submitting');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url =
        mode === 'create'
          ? '/api/admin/articles'
          : `/api/admin/articles/${initialData?.id}`;

      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save article');
      }

      // Redirect to articles list on success
      router.push('/admin/articles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/articles');
  };

  const isFormValid = validateForm();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {mode === 'create' ? 'Create Article' : 'Edit Article'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter article title"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700"
            >
              Slug
            </label>
            <input
              type="text"
              id="slug"
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                slugError
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
              placeholder="article-slug (auto-generated from title)"
            />
            {slugError && (
              <p className="mt-1 text-sm text-red-600">{slugError}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Leave empty to auto-generate from title
            </p>
          </div>

          {/* Summary */}
          <div>
            <label
              htmlFor="summary"
              className="block text-sm font-medium text-gray-700"
            >
              Summary
            </label>
            <textarea
              id="summary"
              rows={3}
              value={formData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Brief summary of the article (optional)"
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.summary?.length || 0}/500 characters
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <Editor
              content={editorContent}
              onChange={handleContentChange}
              placeholder="Write your article content here..."
              error={editorError}
              required
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image
            </label>
            <ImageUploader
              onImageUpload={handleImageUpload}
              currentImage={formData.image}
              onImageRemove={handleImageRemove}
            />
          </div>

          {/* Author */}
          <div>
            <label
              htmlFor="author"
              className="block text-sm font-medium text-gray-700"
            >
              Author *
            </label>
            <select
              id="author"
              value={formData.authorId}
              onChange={(e) => handleInputChange('authorId', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              <option value="">Select an author</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category *
            </label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => handleInputChange('categoryId', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.tagIds.includes(tag.id)}
                    onChange={() => handleTagToggle(tag.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              {formData.status === 'PUBLISHED'
                ? 'Article will be visible to the public'
                : formData.status === 'DRAFT'
                  ? 'Article will be saved as draft'
                  : 'Article will be archived and hidden'}
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Updating...'
                : mode === 'create'
                  ? 'Create Article'
                  : 'Update Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
