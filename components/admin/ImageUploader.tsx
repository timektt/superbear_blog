'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string, publicId: string) => void;
  currentImage?: string;
  onImageRemove?: () => void;
  className?: string;
}

interface UploadResponse {
  success: boolean;
  data?: {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
  };
  error?: string;
}

export default function ImageUploader({
  onImageUpload,
  currentImage,
  onImageRemove,
  className = '',
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result: UploadResponse = await response.json();

      if (result.success && result.data) {
        onImageUpload(result.data.url, result.data.publicId);
      } else {
        setError(result.error || 'Failed to upload image');
      }
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    if (onImageRemove) {
      onImageRemove();
    }
    setError(null);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
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
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm text-gray-600">Current image</span>
            <button
              type="button"
              onClick={openFileDialog}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Replace image
            </button>
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
                <p className="text-sm text-gray-600 mt-2">Uploading...</p>
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
                    JPEG, PNG, WebP, GIF up to 5MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
