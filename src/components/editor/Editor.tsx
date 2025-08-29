'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useCallback, useEffect, useState } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { validateEditorContent, createEmptyDocument } from '@/lib/editor-utils';
import { ProgressIndicator } from './ProgressIndicator';
import { LoadingPlaceholder, MultiLoadingPlaceholder } from './LoadingPlaceholder';
import { ErrorMessage, UploadErrorMessage, ValidationErrorMessage, SuccessMessage } from './ErrorMessage';
import { uploadService, type UploadProgress } from '@/lib/media/upload-service';

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

interface EditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
}

export function Editor({
  content,
  onChange,
  placeholder = 'Start writing...',
  className = '',
  error,
  required = false,
  disabled = false,
}: EditorProps) {
  // State for tracking active uploads
  const [activeUploads, setActiveUploads] = useState<Map<string, string>>(new Map()); // uploadId -> loadingId mapping
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        // Disable the default code block from StarterKit since we're using CodeBlockLowlight
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        validate: (href) => /^https?:\/\//.test(href),
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-sm mx-auto block',
        },
        allowBase64: false,
        inline: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        HTMLAttributes: {
          class:
            'bg-gray-100 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-x-auto whitespace-pre-wrap break-words',
        },
      }),
      Placeholder.configure({
        placeholder: disabled ? 'Editor is disabled' : placeholder,
      }),
    ],
    content: content || JSON.stringify(createEmptyDocument()),
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();

      // Check content size limits
      const contentString = JSON.stringify(json);
      const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB
      const MAX_IMAGES = 20;

      if (contentString.length > MAX_CONTENT_SIZE) {
        console.warn(
          'Content is too large. Please reduce the amount of text or images.'
        );
        return;
      }

      // Count images
      const imageCount = (contentString.match(/"type":"image"/g) || []).length;
      if (imageCount > MAX_IMAGES) {
        console.warn(`Too many images. Maximum allowed: ${MAX_IMAGES}`);
        return;
      }

      // Validate content before calling onChange
      if (validateEditorContent(contentString)) {
        onChange?.(contentString);
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none min-h-[200px] p-3 sm:p-4 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`,
      },
      handleDOMEvents: {
        // Prevent default drag behavior for non-image elements
        dragstart: (view, event) => {
          const target = event.target as HTMLElement;
          if (target.tagName !== 'IMG') {
            event.preventDefault();
          }
          return false;
        },
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== undefined) {
      try {
        const currentContent = JSON.stringify(editor.getJSON());
        if (currentContent !== content) {
          const parsedContent = JSON.parse(content);
          editor.commands.setContent(parsedContent);
        }
      } catch (error) {
        console.warn('Invalid content provided to editor:', error);
        editor.commands.setContent(createEmptyDocument());
      }
    }
  }, [editor, content]);

  // Cancel upload function
  const cancelUpload = useCallback(
    (uploadId: string) => {
      uploadService.cancelUpload(uploadId);
      
      // Remove from active uploads
      const loadingId = activeUploads.get(uploadId);
      if (loadingId) {
        removeElement(loadingId);
        setActiveUploads(prev => {
          const newMap = new Map(prev);
          newMap.delete(uploadId);
          return newMap;
        });
      }
      
      // Show cancellation message
      insertSuccessMessage('Upload cancelled', false);
    },
    [activeUploads, removeElement, insertSuccessMessage]
  );

  // Helper functions for UI feedback with enhanced styling
  const insertLoadingPlaceholder = useCallback(
    (id: string, fileName: string, uploadId?: string, showProgress = false, progress = 0) => {
      if (!editor) return;

      const progressBar = showProgress ? `
        <div class="progress-section" style="margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span>Progress</span>
            <span class="progress-text">${progress}%</span>
          </div>
          <div style="background: #e5e7eb; height: 6px; border-radius: 3px; overflow: hidden;">
            <div class="progress-bar" style="background: #3b82f6; height: 100%; width: ${progress}%; transition: width 0.3s ease;"></div>
          </div>
        </div>
      ` : '';

      const cancelButton = uploadId ? `
        <button class="cancel-upload-btn" 
                onclick="window.editorCancelUpload && window.editorCancelUpload('${uploadId}')"
                style="
                  position: absolute;
                  top: 8px;
                  right: 8px;
                  background: rgba(255,255,255,0.9);
                  border: 1px solid #d1d5db;
                  border-radius: 4px;
                  padding: 4px;
                  cursor: pointer;
                  color: #6b7280;
                  font-size: 12px;
                  transition: all 0.2s;
                "
                onmouseover="this.style.color='#ef4444'; this.style.borderColor='#ef4444'"
                onmouseout="this.style.color='#6b7280'; this.style.borderColor='#d1d5db'"
                title="Cancel upload">
          ✕
        </button>
      ` : '';

      const loadingHtml = `
      <div id="${id}" class="loading-placeholder" style="
        display: flex;
        flex-direction: column;
        padding: 16px;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border: 2px dashed #3b82f6;
        border-radius: 12px;
        margin: 12px 0;
        color: #1e40af;
        font-size: 14px;
        position: relative;
        overflow: hidden;
      ">
        ${cancelButton}
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="
            width: 20px;
            height: 20px;
            border: 2px solid #bfdbfe;
            border-top: 2px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            flex-shrink: 0;
          "></div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">Uploading image...</div>
            <div style="font-size: 12px; opacity: 0.8; word-break: break-all;">${fileName}</div>
          </div>
        </div>
        ${progressBar}
        <div style="
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shimmer 2s infinite;
        "></div>
      </div>
    `;

      editor.chain().focus().insertContent(loadingHtml).run();
      
      // Set up global cancel function
      if (uploadId) {
        (window as any).editorCancelUpload = cancelUpload;
      }
    },
    [editor, cancelUpload]
  );

  const updateLoadingProgress = useCallback(
    (id: string, progress: number) => {
      if (!editor) return;

      const element = editor.view.dom.querySelector(`#${id}`);
      if (element) {
        const progressBar = element.querySelector('.progress-bar') as HTMLElement;
        const progressText = element.querySelector('.progress-text') as HTMLElement;
        
        if (progressBar) {
          progressBar.style.width = `${progress}%`;
        }
        if (progressText) {
          progressText.textContent = `${progress}%`;
        }
      }
    },
    [editor]
  );

  const insertErrorMessage = useCallback(
    (message: string, details?: string, actions?: Array<{label: string, onClick: () => void}>) => {
      if (!editor) return;

      const errorId = `error-${Date.now()}`;
      const detailsSection = details ? `
        <div style="margin-top: 8px;">
          <button onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.textContent = this.textContent === 'Show details' ? 'Hide details' : 'Show details';" 
                  style="background: none; border: none; color: #dc2626; text-decoration: underline; cursor: pointer; font-size: 12px;">
            Show details
          </button>
          <div style="display: none; margin-top: 4px; padding: 8px; background: rgba(255,255,255,0.5); border-radius: 4px; font-size: 11px; font-family: monospace; white-space: pre-wrap;">
            ${details}
          </div>
        </div>
      ` : '';

      const errorHtml = `
      <div id="${errorId}" class="error-message" style="
        padding: 16px;
        background: #fef2f2;
        border: 2px solid #fecaca;
        border-radius: 12px;
        margin: 12px 0;
        color: #dc2626;
        font-size: 14px;
        position: relative;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: start; gap: 12px;">
          <span style="font-size: 18px; flex-shrink: 0;">❌</span>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">Upload Error</div>
            <div style="line-height: 1.4; white-space: pre-line;">${message}</div>
            ${detailsSection}
          </div>
          <button onclick="this.parentElement.parentElement.remove()" 
                  style="background: none; border: none; color: #dc2626; cursor: pointer; padding: 4px; border-radius: 4px; opacity: 0.7; transition: opacity 0.2s;"
                  onmouseover="this.style.opacity='1'" 
                  onmouseout="this.style.opacity='0.7'"
                  title="Dismiss">
            ✕
          </button>
        </div>
      </div>
    `;

      editor.chain().focus().insertContent(errorHtml).run();
    },
    [editor]
  );

  const insertSuccessMessage = useCallback(
    (message: string, autoHide = true) => {
      if (!editor) return;

      const successId = `success-${Date.now()}`;
      const successHtml = `
      <div id="${successId}" class="success-message" style="
        padding: 12px 16px;
        background: #f0fdf4;
        border: 2px solid #bbf7d0;
        border-radius: 8px;
        margin: 8px 0;
        color: #166534;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideIn 0.3s ease-out;
      ">
        <span style="font-size: 16px;">✅</span>
        <span style="font-weight: 500;">${message}</span>
      </div>
    `;

      editor.chain().focus().insertContent(successHtml).run();

      if (autoHide) {
        setTimeout(() => {
          removeElement(successId);
        }, 3000);
      }
    },
    [editor]
  );

  const removeElement = useCallback(
    (id: string) => {
      if (!editor) return;

      const element = editor.view.dom.querySelector(`#${id}`);
      if (element) {
        element.remove();
      }
    },
    [editor]
  );

  // Enhanced image upload function using the new upload service
  const uploadAndInsertImage = useCallback(
    async (file: File) => {
      if (!editor || disabled) return;

      const loadingId = `loading-${Date.now()}`;
      let uploadId: string | undefined;
      
      try {
        // Use the upload service with progress tracking
        const result = await uploadService.uploadImage(file, {
          folder: 'superbear_blog/articles',
          onProgress: (progress) => {
            uploadId = progress.uploadId;
            
            // Insert loading placeholder on first progress update
            if (progress.progress === 0 || progress.status === 'pending') {
              insertLoadingPlaceholder(loadingId, file.name, uploadId, true, 0);
              setActiveUploads(prev => new Map(prev.set(uploadId!, loadingId)));
            } else {
              // Update existing progress
              updateLoadingProgress(loadingId, progress.progress);
            }
          },
          onError: (error) => {
            // Remove from active uploads
            setActiveUploads(prev => {
              const newMap = new Map(prev);
              newMap.delete(error.uploadId);
              return newMap;
            });
            
            // Remove loading placeholder and show error
            removeElement(loadingId);
            insertErrorMessage(
              `Failed to upload "${file.name}"`,
              error.message,
            );
          }
        });

        // Remove from active uploads
        if (uploadId) {
          setActiveUploads(prev => {
            const newMap = new Map(prev);
            newMap.delete(uploadId!);
            return newMap;
          });
        }

        // Remove loading placeholder
        removeElement(loadingId);

        if (result.success && result.data?.url) {
          // Insert the image
          editor
            .chain()
            .focus()
            .setImage({
              src: result.data.url,
              alt: file.name,
              title: file.name,
              'data-public-id': result.data.publicId, // Store publicId for tracking
            })
            .run();

          // Show brief success message
          insertSuccessMessage(`"${file.name}" uploaded successfully`);

        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Image upload failed:', error);
        
        // Remove from active uploads if needed
        if (uploadId) {
          setActiveUploads(prev => {
            const newMap = new Map(prev);
            newMap.delete(uploadId!);
            return newMap;
          });
        }
        
        // Remove loading placeholder if still present
        removeElement(loadingId);
        
        // Insert error message
        insertErrorMessage(
          `Failed to upload "${file.name}"`,
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
      }
    },
    [editor, disabled, insertLoadingPlaceholder, updateLoadingProgress, removeElement, insertErrorMessage, insertSuccessMessage, setActiveUploads]
  );

  // Update editor editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  // Enhanced clipboard paste support
  useEffect(() => {
    if (!editor) return;

    const handlePaste = async (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      const items = Array.from(clipboardData.items);
      const imageItems = items.filter(item => item.type.startsWith('image/'));
      
      // If no images in clipboard, let default paste behavior handle text/html
      if (imageItems.length === 0) {
        // Check for HTML content with images
        const htmlData = clipboardData.getData('text/html');
        if (htmlData) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlData;
          const images = tempDiv.querySelectorAll('img');
          
          if (images.length > 0) {
            event.preventDefault();
            
            // Show notification about HTML images
            insertErrorMessage(
              'Images from web pages cannot be pasted directly. Please save the image and upload it manually, or drag and drop the image file.'
            );
            
            // Insert the HTML content without images for text content
            const textContent = tempDiv.textContent || tempDiv.innerText || '';
            if (textContent.trim()) {
              editor.chain().focus().insertContent(textContent).run();
            }
          }
        }
        return;
      }

      // Prevent default paste behavior for images
      event.preventDefault();

      // Validate and process image items
      const validImages: File[] = [];
      const invalidImages: { item: DataTransferItem; reason: string }[] = [];

      for (const item of imageItems) {
        const file = item.getAsFile();
        if (!file) {
          invalidImages.push({ item, reason: 'Could not read image data' });
          continue;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          invalidImages.push({ item, reason: 'Image too large (max 10MB)' });
          continue;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          invalidImages.push({ item, reason: `Unsupported format: ${file.type}` });
          continue;
        }

        validImages.push(file);
      }

      // Show errors for invalid images
      if (invalidImages.length > 0) {
        const errorMessages = invalidImages.map(({ reason }) => reason);
        insertErrorMessage(`Some images could not be pasted:\n${errorMessages.join('\n')}`);
      }

      // Process valid images
      if (validImages.length === 0) {
        if (invalidImages.length === 0) {
          insertErrorMessage('No valid images found in clipboard. Try copying the image file directly.');
        }
        return;
      }

      // Handle multiple images
      if (validImages.length > 1) {
        const multiPasteId = `multi-paste-${Date.now()}`;
        const progressHtml = `
          <div id="${multiPasteId}" class="multi-paste-progress" style="
            padding: 16px;
            background: #f0f9ff;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            margin: 12px 0;
          ">
            <div style="font-weight: 600; margin-bottom: 8px; color: #1e40af;">
              📋 Pasting ${validImages.length} images from clipboard...
            </div>
            <div class="progress-container" style="
              background: #dbeafe;
              height: 8px;
              border-radius: 4px;
              overflow: hidden;
            ">
              <div class="progress-bar" style="
                background: #3b82f6;
                height: 100%;
                width: 0%;
                transition: width 0.3s ease;
              "></div>
            </div>
            <div class="progress-text" style="
              font-size: 12px;
              color: #1e40af;
              margin-top: 4px;
            ">0 of ${validImages.length} processed</div>
          </div>
        `;
        editor.chain().focus().insertContent(progressHtml).run();

        // Process images with progress tracking
        let processed = 0;
        const updateProgress = () => {
          const progressBar = document.querySelector(`#${multiPasteId} .progress-bar`) as HTMLElement;
          const progressText = document.querySelector(`#${multiPasteId} .progress-text`) as HTMLElement;
          if (progressBar && progressText) {
            const percentage = (processed / validImages.length) * 100;
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${processed} of ${validImages.length} processed`;
          }
        };

        // Process images sequentially
        for (const file of validImages) {
          try {
            // Generate a more descriptive filename for pasted images
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const pastedFile = new File([file], `pasted-image-${timestamp}.${file.type.split('/')[1]}`, {
              type: file.type,
              lastModified: Date.now()
            });

            await uploadAndInsertImage(pastedFile);
            processed++;
            updateProgress();
          } catch (error) {
            console.error('Failed to upload pasted image:', error);
            insertErrorMessage('Failed to upload one of the pasted images');
          }
        }

        // Remove progress indicator
        removeElement(multiPasteId);
      } else {
        // Single image
        const file = validImages[0];
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const pastedFile = new File([file], `pasted-image-${timestamp}.${file.type.split('/')[1]}`, {
          type: file.type,
          lastModified: Date.now()
        });

        // Show a brief notification for single image paste
        const pasteNotificationId = `paste-notification-${Date.now()}`;
        const notificationHtml = `
          <div id="${pasteNotificationId}" class="paste-notification" style="
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #f0f9ff;
            border: 1px solid #3b82f6;
            border-radius: 6px;
            color: #1e40af;
            font-size: 14px;
            margin: 4px 0;
          ">
            📋 Pasting image from clipboard...
          </div>
        `;
        editor.chain().focus().insertContent(notificationHtml).run();

        try {
          await uploadAndInsertImage(pastedFile);
          removeElement(pasteNotificationId);
        } catch (error) {
          removeElement(pasteNotificationId);
          throw error;
        }
      }
    };

    // Also handle paste events on the document level for better coverage
    const handleDocumentPaste = (event: ClipboardEvent) => {
      // Only handle if the editor is focused
      if (document.activeElement && editor.view.dom.contains(document.activeElement)) {
        handlePaste(event);
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('paste', handlePaste);
    document.addEventListener('paste', handleDocumentPaste);

    return () => {
      editorElement.removeEventListener('paste', handlePaste);
      document.removeEventListener('paste', handleDocumentPaste);
    };
  }, [editor, uploadAndInsertImage, insertErrorMessage, removeElement]);

  // Enhanced drag and drop support with visual feedback
  useEffect(() => {
    if (!editor) return;

    let dragCounter = 0;
    let dragOverlay: HTMLElement | null = null;

    const createDragOverlay = () => {
      if (dragOverlay) return dragOverlay;

      dragOverlay = document.createElement('div');
      dragOverlay.className = 'drag-drop-overlay';
      dragOverlay.innerHTML = `
        <div class="drag-drop-content">
          <div class="drag-drop-icon">📁</div>
          <div class="drag-drop-text">Drop images here to upload</div>
          <div class="drag-drop-subtext">Supports JPG, PNG, GIF, WebP (max 10MB each)</div>
        </div>
      `;
      
      // Position overlay over editor
      const editorElement = editor.view.dom;
      const rect = editorElement.getBoundingClientRect();
      dragOverlay.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: rgba(59, 130, 246, 0.1);
        border: 3px dashed #3b82f6;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        pointer-events: none;
        backdrop-filter: blur(2px);
      `;

      // Style the content
      const content = dragOverlay.querySelector('.drag-drop-content') as HTMLElement;
      if (content) {
        content.style.cssText = `
          text-align: center;
          color: #3b82f6;
          font-weight: 600;
        `;
      }

      const icon = dragOverlay.querySelector('.drag-drop-icon') as HTMLElement;
      if (icon) {
        icon.style.cssText = `
          font-size: 48px;
          margin-bottom: 16px;
          animation: bounce 1s infinite;
        `;
      }

      const text = dragOverlay.querySelector('.drag-drop-text') as HTMLElement;
      if (text) {
        text.style.cssText = `
          font-size: 18px;
          margin-bottom: 8px;
        `;
      }

      const subtext = dragOverlay.querySelector('.drag-drop-subtext') as HTMLElement;
      if (subtext) {
        subtext.style.cssText = `
          font-size: 14px;
          opacity: 0.8;
        `;
      }

      document.body.appendChild(dragOverlay);
      return dragOverlay;
    };

    const removeDragOverlay = () => {
      if (dragOverlay) {
        document.body.removeChild(dragOverlay);
        dragOverlay = null;
      }
    };

    const validateDraggedFiles = (files: FileList): { valid: File[]; invalid: File[]; errors: string[] } => {
      const valid: File[] = [];
      const invalid: File[] = [];
      const errors: string[] = [];

      Array.from(files).forEach(file => {
        // Check if it's an image
        if (!file.type.startsWith('image/')) {
          invalid.push(file);
          errors.push(`${file.name}: Not an image file`);
          return;
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          invalid.push(file);
          errors.push(`${file.name}: File too large (max 10MB)`);
          return;
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          invalid.push(file);
          errors.push(`${file.name}: Unsupported format`);
          return;
        }

        valid.push(file);
      });

      return { valid, invalid, errors };
    };

    const handleDrop = async (event: DragEvent) => {
      event.preventDefault();
      dragCounter = 0;
      removeDragOverlay();

      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;

      // Validate files
      const { valid, invalid, errors } = validateDraggedFiles(files);

      // Show errors for invalid files
      if (errors.length > 0) {
        insertErrorMessage(`Some files could not be uploaded:\n${errors.join('\n')}`);
      }

      // Upload valid files
      if (valid.length > 0) {
        // Show progress for multiple files
        if (valid.length > 1) {
          const multiUploadId = `multi-upload-${Date.now()}`;
          const progressHtml = `
            <div id="${multiUploadId}" class="multi-upload-progress" style="
              padding: 16px;
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              margin: 12px 0;
            ">
              <div style="font-weight: 600; margin-bottom: 8px; color: #475569;">
                Uploading ${valid.length} images...
              </div>
              <div class="progress-container" style="
                background: #e2e8f0;
                height: 8px;
                border-radius: 4px;
                overflow: hidden;
              ">
                <div class="progress-bar" style="
                  background: #3b82f6;
                  height: 100%;
                  width: 0%;
                  transition: width 0.3s ease;
                "></div>
              </div>
              <div class="progress-text" style="
                font-size: 12px;
                color: #64748b;
                margin-top: 4px;
              ">0 of ${valid.length} completed</div>
            </div>
          `;
          editor.chain().focus().insertContent(progressHtml).run();

          // Upload files with progress tracking
          let completed = 0;
          const updateProgress = () => {
            const progressBar = document.querySelector(`#${multiUploadId} .progress-bar`) as HTMLElement;
            const progressText = document.querySelector(`#${multiUploadId} .progress-text`) as HTMLElement;
            if (progressBar && progressText) {
              const percentage = (completed / valid.length) * 100;
              progressBar.style.width = `${percentage}%`;
              progressText.textContent = `${completed} of ${valid.length} completed`;
            }
          };

          // Upload files sequentially to avoid overwhelming the server
          for (const file of valid) {
            try {
              await uploadAndInsertImage(file);
              completed++;
              updateProgress();
            } catch (error) {
              console.error(`Failed to upload ${file.name}:`, error);
              insertErrorMessage(`Failed to upload ${file.name}`);
            }
          }

          // Remove progress indicator
          removeElement(multiUploadId);
        } else {
          // Single file upload
          await uploadAndInsertImage(valid[0]);
        }
      }
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'copy';
      
      // Update overlay based on file validation
      if (dragOverlay && event.dataTransfer?.items) {
        const files = Array.from(event.dataTransfer.items)
          .filter(item => item.kind === 'file')
          .map(item => item.getAsFile())
          .filter(file => file !== null) as File[];
        
        if (files.length > 0) {
          const { valid, invalid } = validateDraggedFiles(files as any);
          const content = dragOverlay.querySelector('.drag-drop-content') as HTMLElement;
          
          if (invalid.length > 0 && valid.length === 0) {
            // All files invalid
            dragOverlay.style.background = 'rgba(239, 68, 68, 0.1)';
            dragOverlay.style.borderColor = '#ef4444';
            if (content) content.style.color = '#ef4444';
            
            const text = dragOverlay.querySelector('.drag-drop-text') as HTMLElement;
            const subtext = dragOverlay.querySelector('.drag-drop-subtext') as HTMLElement;
            if (text) text.textContent = 'Cannot upload these files';
            if (subtext) subtext.textContent = `${invalid.length} invalid file(s)`;
          } else if (invalid.length > 0) {
            // Some files invalid
            dragOverlay.style.background = 'rgba(245, 158, 11, 0.1)';
            dragOverlay.style.borderColor = '#f59e0b';
            if (content) content.style.color = '#f59e0b';
            
            const text = dragOverlay.querySelector('.drag-drop-text') as HTMLElement;
            const subtext = dragOverlay.querySelector('.drag-drop-subtext') as HTMLElement;
            if (text) text.textContent = `Upload ${valid.length} valid file(s)`;
            if (subtext) subtext.textContent = `${invalid.length} file(s) will be skipped`;
          }
        }
      }
    };

    const handleDragEnter = (event: DragEvent) => {
      event.preventDefault();
      dragCounter++;
      
      // Only create overlay on first drag enter
      if (dragCounter === 1) {
        createDragOverlay();
      }
    };

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault();
      dragCounter--;
      
      // Remove overlay when drag leaves editor area completely
      if (dragCounter === 0) {
        removeDragOverlay();
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('drop', handleDrop);
    editorElement.addEventListener('dragover', handleDragOver);
    editorElement.addEventListener('dragenter', handleDragEnter);
    editorElement.addEventListener('dragleave', handleDragLeave);

    return () => {
      editorElement.removeEventListener('drop', handleDrop);
      editorElement.removeEventListener('dragover', handleDragOver);
      editorElement.removeEventListener('dragenter', handleDragEnter);
      editorElement.removeEventListener('dragleave', handleDragLeave);
      removeDragOverlay();
    };
  }, [editor, uploadAndInsertImage, insertErrorMessage, removeElement]);

  const setLink = useCallback(() => {
    if (!editor || disabled) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Enhanced URL validation
    try {
      const parsedUrl = new URL(url);
      // Only allow HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        alert('Please enter a valid HTTP or HTTPS URL');
        return;
      }
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer',
        })
        .run();
    } catch {
      alert('Please enter a valid URL');
    }
  }, [editor, disabled]);

  const addImage = useCallback(async () => {
    if (!editor || disabled) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        await uploadAndInsertImage(file);
      }
    };

    input.click();
  }, [editor, disabled, uploadAndInsertImage]);

  // Broken image handling
  useEffect(() => {
    if (!editor) return;

    const handleImageError = (event: Event) => {
      const img = event.target as HTMLImageElement;
      if (img.tagName === 'IMG') {
        // Replace broken image with placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'broken-image-placeholder';
        placeholder.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100px;
          background: #f3f4f6;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          color: #6b7280;
          font-size: 14px;
          margin: 10px 0;
        `;
        placeholder.innerHTML = `
          <div style="text-align: center;">
            <div style="font-size: 24px; margin-bottom: 8px;">🖼️</div>
            <div>Image failed to load</div>
            <div style="font-size: 12px; margin-top: 4px; color: #9ca3af;">
              ${img.src.substring(0, 50)}...
            </div>
          </div>
        `;
        img.parentNode?.replaceChild(placeholder, img);
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('error', handleImageError, true);

    return () => {
      editorElement.removeEventListener('error', handleImageError, true);
    };
  }, [editor]);

  if (!editor) {
    return (
      <div
        className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}
      >
        <div className="p-4 text-gray-500">Loading editor...</div>
      </div>
    );
  }

  const borderColor = error ? 'border-red-500' : 'border-gray-300';

  return (
    <div
      className={`border ${borderColor} rounded-lg overflow-hidden ${className}`}
    >
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0, 0, 0);
          }
          40%, 43% {
            transform: translate3d(0, -8px, 0);
          }
          70% {
            transform: translate3d(0, -4px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .ProseMirror.drag-over {
          background-color: #f0f9ff;
          border-color: #3b82f6;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin: 10px auto;
          display: block;
        }
        .ProseMirror img:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s ease;
        }
        .broken-image-placeholder {
          cursor: pointer;
        }
        .broken-image-placeholder:hover {
          background: #e5e7eb;
        }
        .drag-drop-overlay {
          transition: all 0.2s ease;
        }
        .loading-placeholder,
        .error-message,
        .success-message,
        .multi-upload-progress,
        .multi-paste-progress {
          animation: slideIn 0.3s ease-out;
        }
        .loading-placeholder .shimmer {
          animation: shimmer 2s infinite;
        }
        /* Enhanced progress tracking styles */
        .upload-progress-container,
        .upload-error-container,
        .upload-success-container {
          margin: 8px 0;
        }
      `}</style>
      <EditorToolbar
        editor={editor}
        onSetLink={setLink}
        onAddImage={addImage}
        disabled={disabled}
      />
      <EditorContent editor={editor} />
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}
      {required && (
        <div className="px-4 py-1 bg-gray-50 border-t border-gray-200 text-gray-500 text-xs">
          * Required field
        </div>
      )}
    </div>
  );
}
