'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Editor } from '@/components/editor/Editor';
import { useEditorState } from '@/components/editor/useEditor';
import ImageUploader from '@/components/admin/ImageUploader';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { useToast } from '@/lib/hooks/useToast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import {
  articleFormSchema,
  type ArticleFormData,
  generateSlugFromTitle,
  validateSlug,
} from '@/lib/validations/article';
import { createEmptyDocument } from '@/lib/editor-utils';
// Remove direct import of uploadService - use API instead
export interface UploadProgress {
  uploadId: string;
  filename: string;
  progress: number;
  status:
    | 'pending'
    | 'uploading'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled';
  bytesUploaded: number;
  totalBytes: number;
  error?: string;
  startTime: Date;
  endTime?: Date;
}
import { mediaTracker } from '@/lib/media/media-tracker';
import {
  useMediaTracking,
  useMediaUploadTracking,
} from '@/lib/hooks/useMediaTracking';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

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

interface EnhancedImageUploaderProps {
  onImageUpload: (file: File) => void;
  currentImage?: string;
  onImageRemove?: () => void;
  uploadProgress?: UploadProgress | null;
  isUploading?: boolean;
  className?: string;
}

function EnhancedImageUploader({
  onImageUpload,
  currentImage,
  onImageRemove,
  uploadProgress,
  isUploading = false,
  className = '',
}: EnhancedImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    setImageError(null);

    // Validate file type and size
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.type)) {
      setImageError(
        'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
      );
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setImageError('File size must be less than 10MB');
      return;
    }

    onImageUpload(file);
  };

  const handleRemoveImage = () => {
    if (onImageRemove) {
      onImageRemove();
    }
    setImageError(null);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getProgressPercentage = () => {
    return uploadProgress?.progress || 0;
  };

  const getProgressStatus = () => {
    if (!uploadProgress) return '';

    switch (uploadProgress.status) {
      case 'pending':
        return 'Preparing upload...';
      case 'uploading':
        return `Uploading... ${Math.round(uploadProgress.progress)}%`;
      case 'processing':
        return 'Processing image...';
      case 'completed':
        return 'Upload complete!';
      case 'failed':
        return `Upload failed: ${uploadProgress.error}`;
      case 'cancelled':
        return 'Upload cancelled';
      default:
        return '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {currentImage ? (
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            <img
              src={currentImage}
              alt="Uploaded image"
              className="w-full h-48 object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">{getProgressStatus()}</p>
                  {uploadProgress && (
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage()}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm text-gray-600">Current image</span>
            {!isUploading && (
              <button
                type="button"
                onClick={openFileDialog}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Replace image
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!isUploading ? openFileDialog : undefined}
        >
          <div className="space-y-4">
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600 mt-2">
                  {getProgressStatus()}
                </p>
                {uploadProgress && (
                  <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  {isDragging ? (
                    <Upload className="w-12 h-12 text-blue-500" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {isDragging ? 'Drop image here' : 'Upload cover image'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Drag and drop or click to select
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, PNG, WebP, GIF up to 10MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {imageError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{imageError}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}

function ArticleFormContent({ initialData, mode }: ArticleFormProps) {
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();

  // Media tracking hooks
  const { validateImageReferences, updateCoverImageReference } =
    useMediaTracking();
  const { trackUpload } = useMediaUploadTracking();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
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

  // Media tracking state
  const [imagePublicId, setImagePublicId] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [isImageUploading, setIsImageUploading] = useState(false);

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
      } catch (err) {
        console.error('Failed to fetch form options:', err);
        error(
          'Failed to load form options',
          'Please refresh the page and try again.'
        );
      }
    };

    fetchFormOptions();
  }, [error]);

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
    setSubmitError(null);
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

  const handleImageUpload = async (file: File) => {
    setIsImageUploading(true);
    setUploadProgress(null);

    try {
      // Use API endpoint for upload instead of direct service
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update form data with new image URL
      setFormData((prev) => ({ ...prev, image: result.data.url }));
      setImagePublicId(result.data.publicId);

      // Track the upload in media tracker
      await trackUpload(result.data, {
        contentType: 'article',
        contentId: initialData?.id,
        referenceContext: 'cover_image',
        uploadedBy: 'current_user', // TODO: Get actual user ID from auth
      });

      success(
        'Image uploaded successfully',
        'Cover image has been uploaded and is ready to use.'
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to upload image';
      error('Upload failed', errorMessage);
    } finally {
      setIsImageUploading(false);
      setUploadProgress(null);
    }
  };

  const handleImageRemove = () => {
    setFormData((prev) => ({ ...prev, image: '' }));
    setImagePublicId('');
    setUploadProgress(null);
  };

  const validateForm = (): boolean => {
    try {
      articleFormSchema.parse(formData);
      return isEditorValid && !slugError;
    } catch {
      return false;
    }
  };

  const validateMediaReferences = async (): Promise<boolean> => {
    try {
      const validation = await validateImageReferences(formData.content);
      if (!validation.valid) {
        setSubmitError(
          `Missing images detected: ${validation.missingImages.join(', ')}`
        );
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to validate media references:', err);
      // Don't block submission for validation errors
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitError('Please fix all validation errors before submitting');
      return;
    }

    // Validate media references
    const mediaValid = await validateMediaReferences();
    if (!mediaValid) {
      return;
    }

    setLoading(true);
    setSubmitError(null);
    setFormError(null);

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

      const result = await response.json();

      // Media tracking is now handled by the API routes

      // Show success notification
      success(
        mode === 'create'
          ? 'Article created successfully!'
          : 'Article updated successfully!',
        `"${result.title}" has been ${mode === 'create' ? 'created' : 'updated'}.`
      );

      // Redirect to articles list on success
      setTimeout(() => {
        router.push('/admin/articles');
      }, 1000); // Small delay to show the success message
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';

      setSubmitError(errorMessage);
      setFormError(errorMessage);

      error(
        mode === 'create'
          ? 'Failed to create article'
          : 'Failed to update article',
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/articles');
  };

  const isFormValid = validateForm();

  return (
    <>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h1 className="text-lg sm:text-xl font-medium text-gray-900">
              {mode === 'create' ? 'Create New Article' : 'Edit Article'}
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 space-y-6"
            noValidate
          >
            {(submitError || formError) && (
              <div
                className="rounded-md bg-red-50 p-4"
                role="alert"
                aria-live="polite"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-1 text-sm text-red-700">
                      {submitError || formError}
                    </div>
                  </div>
                </div>
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
              <EnhancedImageUploader
                onImageUpload={handleImageUpload}
                currentImage={formData.image}
                onImageRemove={handleImageRemove}
                uploadProgress={uploadProgress}
                isUploading={isImageUploading}
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
                onChange={(e) =>
                  handleInputChange('categoryId', e.target.value)
                }
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
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center touch-target"
                  >
                    <input
                      type="checkbox"
                      checked={formData.tagIds.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-gray-300 rounded"
                      aria-describedby={`tag-${tag.id}-description`}
                    />
                    <span
                      id={`tag-${tag.id}-description`}
                      className="ml-2 text-sm text-gray-700 select-none"
                    >
                      {tag.name}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

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
            <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                aria-describedby={
                  !isFormValid ? 'form-validation-error' : undefined
                }
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </span>
                ) : mode === 'create' ? (
                  'Create Article'
                ) : (
                  'Update Article'
                )}
              </button>
            </div>
            {!isFormValid && (
              <div id="form-validation-error" className="sr-only">
                Please fix all validation errors before submitting the form.
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

export default function ArticleForm(props: ArticleFormProps) {
  return (
    <ErrorBoundary>
      <ArticleFormContent {...props} />
    </ErrorBoundary>
  );
}
