'use client';

import { useState, useCallback } from 'react';
import type { ToastProps } from '@/components/ui/Toast';

type ToastInput = Omit<ToastProps, 'id' | 'onClose'>;

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((toast: ToastInput) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: () => {}, // Will be set by the container
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback(
    (title: string, message?: string) => {
      return addToast({ type: 'success', title, message });
    },
    [addToast]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      return addToast({ type: 'error', title, message });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      return addToast({ type: 'warning', title, message });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      return addToast({ type: 'info', title, message });
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
