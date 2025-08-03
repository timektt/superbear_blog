'use client';

import { useState, useCallback } from 'react';
import {
  validateEditorContent,
  sanitizeEditorContent,
  createEmptyDocument,
} from '@/lib/editor-utils';

interface UseEditorOptions {
  initialContent?: string;
  onContentChange?: (content: string, isValid: boolean) => void;
  required?: boolean;
}

export function useEditorState({
  initialContent,
  onContentChange,
  required = false,
}: UseEditorOptions = {}) {
  const [content, setContent] = useState<string>(() => {
    if (initialContent) {
      return initialContent;
    }
    return JSON.stringify(createEmptyDocument());
  });

  const [isValid, setIsValid] = useState<boolean>(() => {
    if (!required && !initialContent) return true;
    return validateEditorContent(initialContent || '');
  });

  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const handleContentChange = useCallback(
    (newContent: string) => {
      setIsDirty(true);
      setError(null);

      // Validate content
      const valid = validateEditorContent(newContent);

      if (!valid) {
        setError('Invalid content format');
        setIsValid(false);
        return;
      }

      // Check if content is empty when required
      if (required) {
        try {
          const parsed = JSON.parse(newContent);
          const isEmpty =
            !parsed.content ||
            parsed.content.length === 0 ||
            (parsed.content.length === 1 &&
              parsed.content[0].type === 'paragraph' &&
              (!parsed.content[0].content ||
                parsed.content[0].content.length === 0));

          if (isEmpty) {
            setError('Content is required');
            setIsValid(false);
          } else {
            setIsValid(true);
          }
        } catch {
          setError('Invalid content format');
          setIsValid(false);
          return;
        }
      } else {
        setIsValid(true);
      }

      setContent(newContent);
      onContentChange?.(newContent, valid);
    },
    [required, onContentChange]
  );

  const sanitizeAndValidate = useCallback(() => {
    const sanitized = sanitizeEditorContent(content);
    if (sanitized) {
      setContent(sanitized);
      setIsValid(true);
      setError(null);
      return sanitized;
    } else {
      setError('Content could not be sanitized');
      setIsValid(false);
      return null;
    }
  }, [content]);

  const reset = useCallback(() => {
    const emptyContent = JSON.stringify(createEmptyDocument());
    setContent(emptyContent);
    setIsValid(!required);
    setError(null);
    setIsDirty(false);
  }, [required]);

  const setValue = useCallback((newContent: string) => {
    setContent(newContent);
    setIsValid(validateEditorContent(newContent));
    setError(null);
    setIsDirty(false);
  }, []);

  return {
    content,
    isValid,
    error,
    isDirty,
    handleContentChange,
    sanitizeAndValidate,
    reset,
    setValue,
  };
}
