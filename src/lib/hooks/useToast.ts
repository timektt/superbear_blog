'use client';

import { useState, useCallback } from 'react';
import type { ToastProps, ToastAction } from '@/components/ui/Toast';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
  action?: ToastAction;
}

type ToastInput = Omit<ToastProps, 'id' | 'onClose'>;

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).slice(2, 11);
    const newToast: ToastProps = {
      id,
      variant: options.variant || 'default',
      title: options.title,
      description: options.description,
      duration: options.duration,
      action: options.action,
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
  const success = useCallback(
    (title: string, description?: string, options?: Partial<ToastOptions>) => {
      return toast({ 
        title, 
        description, 
        variant: 'success',
        ...options 
      });
    },
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string, options?: Partial<ToastOptions>) => {
      return toast({ 
        title, 
        description, 
        variant: 'destructive',
        ...options 
      });
    },
    [toast]
  );

  const warning = useCallback(
    (title: string, description?: string, options?: Partial<ToastOptions>) => {
      return toast({ 
        title, 
        description, 
        variant: 'warning',
        ...options 
      });
    },
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string, options?: Partial<ToastOptions>) => {
      return toast({ 
        title, 
        description, 
        variant: 'default',
        ...options 
      });
    },
    [toast]
  );

  return {
    toast,
    toasts,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };
}
