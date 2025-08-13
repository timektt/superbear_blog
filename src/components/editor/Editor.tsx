'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useCallback, useEffect } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { validateEditorContent, createEmptyDocument } from '@/lib/editor-utils';

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
        class: `max-w-none focus:outline-none min-h-[200px] p-3 sm:p-4 ${
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

  // Helper functions for UI feedback
  const insertLoadingPlaceholder = useCallback(
    (id: string, fileName: string) => {
      if (!editor) return;

      const loadingHtml = `
      <div id="${id}" class="loading-placeholder" style="
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: #f3f4f6;
        border: 2px dashed #d1d5db;
        border-radius: 8px;
        margin: 8px 0;
        color: #6b7280;
        font-size: 14px;
      ">
        <div style="
          width: 16px;
          height: 16px;
          border: 2px solid #d1d5db;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        Uploading ${fileName}...
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

      editor.chain().focus().insertContent(loadingHtml).run();
    },
    [editor]
  );

  const insertErrorMessage = useCallback(
    (message: string) => {
      if (!editor) return;

      const errorHtml = `
      <div class="error-message" style="
        padding: 12px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        margin: 8px 0;
        color: #dc2626;
        font-size: 14px;
      ">
        ⚠️ ${message}
      </div>
    `;

      editor.chain().focus().insertContent(errorHtml).run();
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

  // Enhanced image upload function
  const uploadAndInsertImage = useCallback(
    async (file: File) => {
      if (!editor || disabled) return;

      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        insertErrorMessage('Image size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        insertErrorMessage('Please select a valid image file');
        return;
      }

      // Insert loading placeholder
      const loadingId = `loading-${Date.now()}`;
      insertLoadingPlaceholder(loadingId, file.name);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();

        // Remove loading placeholder
        removeElement(loadingId);

        if (result.success && result.data?.url) {
          editor
            .chain()
            .focus()
            .setImage({
              src: result.data.url,
              alt: file.name,
              title: file.name,
            })
            .run();
        } else {
          throw new Error(result.error || 'No URL returned from upload');
        }
      } catch (error) {
        removeElement(loadingId);
        console.error('Image upload failed:', error);
        insertErrorMessage(
          `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    [
      editor,
      disabled,
      insertLoadingPlaceholder,
      insertErrorMessage,
      removeElement,
    ]
  );

  // Update editor editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  // Clipboard paste support
  useEffect(() => {
    if (!editor) return;

    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await uploadAndInsertImage(file);
          }
          break;
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('paste', handlePaste);

    return () => {
      editorElement.removeEventListener('paste', handlePaste);
    };
  }, [editor, uploadAndInsertImage]);

  // Drag and drop support
  useEffect(() => {
    if (!editor) return;

    const handleDrop = async (event: DragEvent) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer?.files || []);
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));

      if (imageFiles.length === 0) return;

      // Upload and insert each image
      for (const file of imageFiles) {
        await uploadAndInsertImage(file);
      }
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'copy';
    };

    const handleDragEnter = (event: DragEvent) => {
      event.preventDefault();
      const editorElement = editor.view.dom;
      editorElement.classList.add('drag-over');
    };

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault();
      const editorElement = editor.view.dom;
      if (!editorElement.contains(event.relatedTarget as Node)) {
        editorElement.classList.remove('drag-over');
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
    };
  }, [editor, uploadAndInsertImage]);

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
