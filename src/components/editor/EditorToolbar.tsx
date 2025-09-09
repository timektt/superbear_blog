
'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link,
  Unlink,
  Image,
  FileCode,
  ChevronDown,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor;
  onSetLink: () => void;
  onAddImage: () => void;
  disabled?: boolean;
}

export function EditorToolbar({
  editor,
  onSetLink,
  onAddImage,
  disabled = false,
}: EditorToolbarProps) {
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
    }

    if (showLanguageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLanguageDropdown]);

  // Common programming languages for code blocks
  const languages = [
    { value: 'plaintext', label: 'Plain Text' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'scss', label: 'SCSS' },
    { value: 'json', label: 'JSON' },
    { value: 'xml', label: 'XML' },
    { value: 'yaml', label: 'YAML' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'bash', label: 'Bash' },
    { value: 'sql', label: 'SQL' },
  ];

  const setCodeBlock = (language: string) => {
    editor.chain().focus().toggleCodeBlock({ language }).run();
    setShowLanguageDropdown(false);
  };
  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled: buttonDisabled = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || buttonDisabled}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1">
      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => (editor.chain().focus() as any).toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <Bold size={16} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => (editor.chain().focus() as any).toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <Italic size={16} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => (editor.chain().focus() as any).toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => (editor.chain().focus() as any).toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
      >
        <Code size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Headings */}
      <ToolbarButton
        onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 size={16} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => (editor.chain().focus() as any).toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List size={16} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => (editor.chain().focus() as any).toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered size={16} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => (editor.chain().focus() as any).toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Links */}
      <ToolbarButton
        onClick={onSetLink}
        isActive={editor.isActive('link')}
        title="Add Link"
      >
        <Link size={16} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => (editor.chain().focus() as any).unsetLink().run()}
        disabled={!editor.isActive('link')}
        title="Remove Link"
      >
        <Unlink size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Media */}
      <ToolbarButton onClick={onAddImage} title="Add Image">
        <Image size={16} />
      </ToolbarButton>

      {/* Code Block with Language Selector */}
      <div className="relative" ref={dropdownRef}>
        <ToolbarButton
          onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <div className="flex items-center gap-1">
            <FileCode size={16} />
            <ChevronDown size={12} />
          </div>
        </ToolbarButton>

        {showLanguageDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto min-w-[150px]">
            {languages.map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => setCodeBlock(lang.value)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 whitespace-nowrap"
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => (editor.chain().focus() as any).undo().run()}
        disabled={!(editor.can() as any).undo()}
        title="Undo"
      >
        <Undo size={16} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => (editor.chain().focus() as any).redo().run()}
        disabled={!(editor.can() as any).redo()}
        title="Redo"
      >
        <Redo size={16} />
      </ToolbarButton>
    </div>
  );
}
