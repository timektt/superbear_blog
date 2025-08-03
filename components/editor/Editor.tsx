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
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-sm',
        },
        allowBase64: false,
        inline: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        HTMLAttributes: {
          class: 'bg-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto',
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
      const jsonString = JSON.stringify(json);

      // Validate content before calling onChange
      if (validateEditorContent(jsonString)) {
        onChange?.(jsonString);
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`,
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

  // Update editor editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

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

    // Basic URL validation
    try {
      new URL(url);
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
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
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        
        if (data.url) {
          editor.chain().focus().setImage({ src: data.url }).run();
        } else {
          throw new Error('No URL returned from upload');
        }
      } catch (error) {
        console.error('Image upload failed:', error);
        alert('Failed to upload image. Please try again.');
      }
    };

    input.click();
  }, [editor, disabled]);

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
