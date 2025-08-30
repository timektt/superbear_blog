import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { uploadService } from '@/lib/media/upload-service';
import { mediaTracker } from '@/lib/media/media-tracker';

// Mock the TipTap Editor component
const MockTipTapEditor = ({ 
  onImageUpload, 
  onContentChange,
  initialContent = '',
}: {
  onImageUpload?: (file: File) => Promise<{ url: string; publicId: string }>;
  onContentChange?: (content: string) => void;
  initialContent?: string;
}) => {
  const [content, setContent] = React.useState(initialContent);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImageUpload) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 90));
      }, 100);

      const result = await onImageUpload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Insert image into content
      const imageHtml = `<img src="${result.url}" data-public-id="${result.publicId}" alt="Uploaded image" />`;
      const newContent = content + imageHtml;
      setContent(newContent);
      
      if (onContentChange) {
        onContentChange(newContent);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    
    const files = Array.from(event.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile && onImageUpload) {
      setUploading(true);
      try {
        const result = await onImageUpload(imageFile);
        const imageHtml = `<img src="${result.url}" data-public-id="${result.publicId}" alt="Dropped image" />`;
        const newContent = content + imageHtml;
        setContent(newContent);
        
        if (onContentChange) {
          onContentChange(newContent);
        }
      } catch (error) {
        console.error('Drop upload failed:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = Array.from(event.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    
    if (imageItem && onImageUpload) {
      const file = imageItem.getAsFile();
      if (file) {
        setUploading(true);
        try {
          const result = await onImageUpload(file);
          const imageHtml = `<img src="${result.url}" data-public-id="${result.publicId}" alt="Pasted image" />`;
          const newContent = content + imageHtml;
          setContent(newContent);
          
          if (onContentChange) {
            onContentChange(newContent);
          }
        } catch (error) {
          console.error('Paste upload failed:', error);
        } finally {
          setUploading(false);
        }
      }
    }
  };

  return (
    <div>
      <div
        data-testid="editor-content"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPaste={handlePaste}
        contentEditable
        style={{ 
          border: '1px solid #ccc', 
          minHeight: '200px', 
          padding: '10px',
          backgroundColor: uploading ? '#f0f0f0' : 'white'
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        data-testid="file-input"
        style={{ marginTop: '10px' }}
      />
      
      {uploading && (
        <div data-testid="upload-progress">
          <div>Uploading... {uploadProgress}%</div>
          <div 
            style={{ 
              width: '100%', 
              height: '10px', 
              backgroundColor: '#f0f0f0',
              marginTop: '5px'
            }}
          >
            <div 
              style={{ 
                width: `${uploadProgress}%`, 
                height: '100%', 
                backgroundColor: '#007bff' 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Mock dependencies
jest.mock('@/lib/media/upload-service', () => ({
  uploadService: {
    uploadImage: jest.fn(),
  },
}));

jest.mock('@/lib/media/media-tracker', () => ({
  mediaTracker: {
    trackUpload: jest.fn(),
    extractImageReferences: jest.fn(),
    updateContentReferences: jest.fn(),
  },
}));

// Mock File and DataTransfer for testing
class MockFile extends File {
  constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
    super(bits, name, options);
  }
}

class MockDataTransfer {
  files: FileList;
  items: DataTransferItemList;

  constructor(files: File[] = []) {
    this.files = {
      length: files.length,
      item: (index: number) => files[index] || null,
      [Symbol.iterator]: function* () {
        for (let i = 0; i < files.length; i++) {
          yield files[i];
        }
      },
    } as FileList;

    this.items = {
      length: files.length,
      item: (index: number) => ({
        kind: 'file' as const,
        type: files[index]?.type || '',
        getAsFile: () => files[index] || null,
      }),
      [Symbol.iterator]: function* () {
        for (let i = 0; i < files.length; i++) {
          yield {
            kind: 'file' as const,
            type: files[i]?.type || '',
            getAsFile: () => files[i] || null,
          };
        }
      },
    } as DataTransferItemList;
  }
}

describe('TipTap Editor Integration Tests', () => {
  const mockUploadService = uploadService.uploadImage as jest.Mock;
  const mockMediaTracker = {
    trackUpload: mediaTracker.trackUpload as jest.Mock,
    extractImageReferences: mediaTracker.extractImageReferences as jest.Mock,
    updateContentReferences: mediaTracker.updateContentReferences as jest.Mock,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockFile = (name: string = 'test.jpg', type: string = 'image/jpeg'): File => {
    return new MockFile(['mock content'], name, { type });
  };

  describe('File Upload Integration', () => {
    it('should upload image through file input and insert into editor', async () => {
      const user = userEvent.setup();
      const mockFile = createMockFile('editor-test.jpg');
      
      // Mock successful upload
      mockUploadService.mockResolvedValue({
        success: true,
        data: {
          url: 'https://res.cloudinary.com/test/image/upload/editor-test.jpg',
          publicId: 'superbear_blog/editor-test',
          width: 800,
          height: 600,
          format: 'jpg',
          size: 1024,
          filename: 'editor-test.jpg',
          uploadId: 'upload_123',
        },
      });

      // Mock tracking
      mockMediaTracker.trackUpload.mockResolvedValue({
        id: 'media_123',
        publicId: 'superbear_blog/editor-test',
        url: 'https://res.cloudinary.com/test/image/upload/editor-test.jpg',
      });

      const handleImageUpload = async (file: File) => {
        const uploadResult = await uploadService.uploadImage(file);
        if (uploadResult.success && uploadResult.data) {
          await mediaTracker.trackUpload(uploadResult.data, {
            contentType: 'article',
            contentId: 'test-article',
            referenceContext: 'content',
          });
          return {
            url: uploadResult.data.url,
            publicId: uploadResult.data.publicId,
          };
        }
        throw new Error('Upload failed');
      };

      render(<MockTipTapEditor onImageUpload={handleImageUpload} />);

      // Upload file
      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      // Wait for upload to complete
      await waitFor(() => {
        expect(mockUploadService).toHaveBeenCalledWith(mockFile);
      });

      // Verify image is inserted into editor
      await waitFor(() => {
        const editorContent = screen.getByTestId('editor-content');
        expect(editorContent.innerHTML).toContain('data-public-id="superbear_blog/editor-test"');
        expect(editorContent.innerHTML).toContain('src="https://res.cloudinary.com/test/image/upload/editor-test.jpg"');
      });

      // Verify tracking was called
      expect(mockMediaTracker.trackUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          publicId: 'superbear_blog/editor-test',
        }),
        expect.objectContaining({
          contentType: 'article',
          contentId: 'test-article',
        })
      );
    });

    it('should show upload progress during file upload', async () => {
      const user = userEvent.setup();
      const mockFile = createMockFile('progress-test.jpg');

      // Mock slow upload
      mockUploadService.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            data: {
              url: 'https://res.cloudinary.com/test/image/upload/progress-test.jpg',
              publicId: 'superbear_blog/progress-test',
              width: 800,
              height: 600,
              format: 'jpg',
              size: 1024,
              filename: 'progress-test.jpg',
              uploadId: 'upload_123',
            },
          }), 500)
        )
      );

      const handleImageUpload = async (file: File) => {
        const uploadResult = await uploadService.uploadImage(file);
        if (uploadResult.success && uploadResult.data) {
          return {
            url: uploadResult.data.url,
            publicId: uploadResult.data.publicId,
          };
        }
        throw new Error('Upload failed');
      };

      render(<MockTipTapEditor onImageUpload={handleImageUpload} />);

      // Start upload
      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      // Check progress indicator appears
      await waitFor(() => {
        expect(screen.getByTestId('upload-progress')).toBeInTheDocument();
      });

      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.queryByTestId('upload-progress')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should handle upload errors gracefully', async () => {
      const user = userEvent.setup();
      const mockFile = createMockFile('error-test.jpg');

      // Mock upload failure
      mockUploadService.mockResolvedValue({
        success: false,
        error: 'File validation failed',
      });

      const handleImageUpload = async (file: File) => {
        const uploadResult = await uploadService.uploadImage(file);
        if (uploadResult.success && uploadResult.data) {
          return {
            url: uploadResult.data.url,
            publicId: uploadResult.data.publicId,
          };
        }
        throw new Error(uploadResult.error || 'Upload failed');
      };

      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<MockTipTapEditor onImageUpload={handleImageUpload} />);

      // Upload file
      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      // Wait for error handling
      await waitFor(() => {
        expect(mockUploadService).toHaveBeenCalledWith(mockFile);
      });

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Upload failed:', expect.any(Error));

      // Verify no image was inserted
      const editorContent = screen.getByTestId('editor-content');
      expect(editorContent.innerHTML).not.toContain('img');

      consoleSpy.mockRestore();
    });
  });

  describe('Drag and Drop Integration', () => {
    it('should handle drag and drop image upload', async () => {
      const mockFile = createMockFile('dropped-image.jpg');

      mockUploadService.mockResolvedValue({
        success: true,
        data: {
          url: 'https://res.cloudinary.com/test/image/upload/dropped-image.jpg',
          publicId: 'superbear_blog/dropped-image',
          width: 800,
          height: 600,
          format: 'jpg',
          size: 1024,
          filename: 'dropped-image.jpg',
          uploadId: 'upload_123',
        },
      });

      const handleImageUpload = async (file: File) => {
        const uploadResult = await uploadService.uploadImage(file);
        if (uploadResult.success && uploadResult.data) {
          return {
            url: uploadResult.data.url,
            publicId: uploadResult.data.publicId,
          };
        }
        throw new Error('Upload failed');
      };

      render(<MockTipTapEditor onImageUpload={handleImageUpload} />);

      const editorContent = screen.getByTestId('editor-content');

      // Simulate drag over
      fireEvent.dragOver(editorContent, {
        dataTransfer: new MockDataTransfer([mockFile]),
      });

      // Simulate drop
      fireEvent.drop(editorContent, {
        dataTransfer: new MockDataTransfer([mockFile]),
      });

      // Wait for upload and insertion
      await waitFor(() => {
        expect(mockUploadService).toHaveBeenCalledWith(mockFile);
      });

      await waitFor(() => {
        expect(editorContent.innerHTML).toContain('data-public-id="superbear_blog/dropped-image"');
        expect(editorContent.innerHTML).toContain('alt="Dropped image"');
      });
    });

    it('should ignore non-image files in drag and drop', async () => {
      const mockTextFile = new MockFile(['text content'], 'document.txt', { type: 'text/plain' });

      const handleImageUpload = jest.fn();

      render(<MockTipTapEditor onImageUpload={handleImageUpload} />);

      const editorContent = screen.getByTestId('editor-content');

      // Simulate drop with text file
      fireEvent.drop(editorContent, {
        dataTransfer: new MockDataTransfer([mockTextFile]),
      });

      // Wait a bit to ensure no upload is triggered
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(handleImageUpload).not.toHaveBeenCalled();
    });
  });

  describe('Clipboard Paste Integration', () => {
    it('should handle pasted images from clipboard', async () => {
      const mockFile = createMockFile('pasted-image.png', 'image/png');

      mockUploadService.mockResolvedValue({
        success: true,
        data: {
          url: 'https://res.cloudinary.com/test/image/upload/pasted-image.png',
          publicId: 'superbear_blog/pasted-image',
          width: 800,
          height: 600,
          format: 'png',
          size: 2048,
          filename: 'pasted-image.png',
          uploadId: 'upload_123',
        },
      });

      const handleImageUpload = async (file: File) => {
        const uploadResult = await uploadService.uploadImage(file);
        if (uploadResult.success && uploadResult.data) {
          return {
            url: uploadResult.data.url,
            publicId: uploadResult.data.publicId,
          };
        }
        throw new Error('Upload failed');
      };

      render(<MockTipTapEditor onImageUpload={handleImageUpload} />);

      const editorContent = screen.getByTestId('editor-content');

      // Simulate paste with image
      const clipboardData = {
        items: [
          {
            kind: 'file',
            type: 'image/png',
            getAsFile: () => mockFile,
          },
        ],
      };

      fireEvent.paste(editorContent, {
        clipboardData,
      });

      // Wait for upload and insertion
      await waitFor(() => {
        expect(mockUploadService).toHaveBeenCalledWith(mockFile);
      });

      await waitFor(() => {
        expect(editorContent.innerHTML).toContain('data-public-id="superbear_blog/pasted-image"');
        expect(editorContent.innerHTML).toContain('alt="Pasted image"');
      });
    });

    it('should ignore non-image clipboard content', async () => {
      const handleImageUpload = jest.fn();

      render(<MockTipTapEditor onImageUpload={handleImageUpload} />);

      const editorContent = screen.getByTestId('editor-content');

      // Simulate paste with text content
      const clipboardData = {
        items: [
          {
            kind: 'string',
            type: 'text/plain',
            getAsFile: () => null,
          },
        ],
      };

      fireEvent.paste(editorContent, {
        clipboardData,
      });

      // Wait a bit to ensure no upload is triggered
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(handleImageUpload).not.toHaveBeenCalled();
    });
  });

  describe('Content Reference Tracking Integration', () => {
    it('should track content references when content changes', async () => {
      const initialContent = `
        <p>Article content with images:</p>
        <img src="https://res.cloudinary.com/test/image/upload/superbear_blog/existing-image.jpg" data-public-id="superbear_blog/existing-image" />
      `;

      mockMediaTracker.extractImageReferences.mockReturnValue(['superbear_blog/existing-image']);
      mockMediaTracker.updateContentReferences.mockResolvedValue({
        added: 0,
        removed: 0,
        total: 1,
      });

      const handleContentChange = async (content: string) => {
        const publicIds = mediaTracker.extractImageReferences(content);
        await mediaTracker.updateContentReferences(
          'article',
          'test-article-123',
          content
        );
      };

      render(
        <MockTipTapEditor 
          initialContent={initialContent}
          onContentChange={handleContentChange}
        />
      );

      // Verify initial content tracking
      await waitFor(() => {
        expect(mockMediaTracker.extractImageReferences).toHaveBeenCalledWith(initialContent);
        expect(mockMediaTracker.updateContentReferences).toHaveBeenCalledWith(
          'article',
          'test-article-123',
          initialContent
        );
      });
    });

    it('should update references when new images are added', async () => {
      const mockFile = createMockFile('new-image.jpg');

      mockUploadService.mockResolvedValue({
        success: true,
        data: {
          url: 'https://res.cloudinary.com/test/image/upload/new-image.jpg',
          publicId: 'superbear_blog/new-image',
          width: 800,
          height: 600,
          format: 'jpg',
          size: 1024,
          filename: 'new-image.jpg',
          uploadId: 'upload_123',
        },
      });

      mockMediaTracker.extractImageReferences.mockReturnValue(['superbear_blog/new-image']);
      mockMediaTracker.updateContentReferences.mockResolvedValue({
        added: 1,
        removed: 0,
        total: 1,
      });

      const handleImageUpload = async (file: File) => {
        const uploadResult = await uploadService.uploadImage(file);
        if (uploadResult.success && uploadResult.data) {
          return {
            url: uploadResult.data.url,
            publicId: uploadResult.data.publicId,
          };
        }
        throw new Error('Upload failed');
      };

      const handleContentChange = async (content: string) => {
        const publicIds = mediaTracker.extractImageReferences(content);
        await mediaTracker.updateContentReferences(
          'article',
          'test-article-123',
          content
        );
      };

      const user = userEvent.setup();

      render(
        <MockTipTapEditor 
          onImageUpload={handleImageUpload}
          onContentChange={handleContentChange}
        />
      );

      // Upload new image
      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      // Wait for content update
      await waitFor(() => {
        expect(mockMediaTracker.updateContentReferences).toHaveBeenCalledWith(
          'article',
          'test-article-123',
          expect.stringContaining('data-public-id="superbear_blog/new-image"')
        );
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle multiple concurrent uploads', async () => {
      const files = [
        createMockFile('concurrent1.jpg'),
        createMockFile('concurrent2.jpg'),
        createMockFile('concurrent3.jpg'),
      ];

      // Mock successful uploads with different delays
      mockUploadService
        .mockImplementationOnce(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              success: true,
              data: {
                url: 'https://res.cloudinary.com/test/image/upload/concurrent1.jpg',
                publicId: 'superbear_blog/concurrent1',
                width: 800,
                height: 600,
                format: 'jpg',
                size: 1024,
                filename: 'concurrent1.jpg',
                uploadId: 'upload_1',
              },
            }), 100)
          )
        )
        .mockImplementationOnce(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              success: true,
              data: {
                url: 'https://res.cloudinary.com/test/image/upload/concurrent2.jpg',
                publicId: 'superbear_blog/concurrent2',
                width: 800,
                height: 600,
                format: 'jpg',
                size: 1024,
                filename: 'concurrent2.jpg',
                uploadId: 'upload_2',
              },
            }), 200)
          )
        )
        .mockImplementationOnce(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              success: true,
              data: {
                url: 'https://res.cloudinary.com/test/image/upload/concurrent3.jpg',
                publicId: 'superbear_blog/concurrent3',
                width: 800,
                height: 600,
                format: 'jpg',
                size: 1024,
                filename: 'concurrent3.jpg',
                uploadId: 'upload_3',
              },
            }), 50)
          )
        );

      const handleImageUpload = async (file: File) => {
        const uploadResult = await uploadService.uploadImage(file);
        if (uploadResult.success && uploadResult.data) {
          return {
            url: uploadResult.data.url,
            publicId: uploadResult.data.publicId,
          };
        }
        throw new Error('Upload failed');
      };

      render(<MockTipTapEditor onImageUpload={handleImageUpload} />);

      const editorContent = screen.getByTestId('editor-content');

      // Simulate multiple drops in quick succession
      files.forEach((file, index) => {
        setTimeout(() => {
          fireEvent.drop(editorContent, {
            dataTransfer: new MockDataTransfer([file]),
          });
        }, index * 10);
      });

      // Wait for all uploads to complete
      await waitFor(() => {
        expect(mockUploadService).toHaveBeenCalledTimes(3);
      }, { timeout: 1000 });

      // Verify all images are inserted
      await waitFor(() => {
        expect(editorContent.innerHTML).toContain('superbear_blog/concurrent1');
        expect(editorContent.innerHTML).toContain('superbear_blog/concurrent2');
        expect(editorContent.innerHTML).toContain('superbear_blog/concurrent3');
      });
    });
  });
});