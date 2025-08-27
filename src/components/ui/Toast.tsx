'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  id: string;
  variant: 'default' | 'destructive' | 'success' | 'warning';
  title: string;
  description?: string;
  duration?: number;
  action?: ToastAction;
  onClose: (id: string) => void;
}

export function Toast({
  id,
  variant,
  title,
  description,
  duration = 5000,
  action,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 150); // Animation duration
  };

  const handleActionClick = () => {
    if (action) {
      action.onClick();
      handleClose();
    }
  };

  const getVariantStyles = () => {
    const baseStyles =
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all';
    const animationStyles = isExiting
      ? 'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full opacity-0 translate-x-full'
      : 'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full opacity-100 translate-x-0';

    switch (variant) {
      case 'destructive':
        return `${baseStyles} ${animationStyles} border-destructive bg-destructive text-destructive-foreground`;
      case 'success':
        return `${baseStyles} ${animationStyles} border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200`;
      case 'warning':
        return `${baseStyles} ${animationStyles} border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200`;
      default:
        return `${baseStyles} ${animationStyles} border bg-background text-foreground`;
    }
  };

  const getIcon = () => {
    const iconClass = 'h-4 w-4 flex-shrink-0';

    switch (variant) {
      case 'success':
        return (
          <CheckCircle
            className={`${iconClass} text-green-600 dark:text-green-400`}
          />
        );
      case 'destructive':
        return (
          <XCircle className={`${iconClass} text-destructive-foreground`} />
        );
      case 'warning':
        return (
          <AlertCircle
            className={`${iconClass} text-yellow-600 dark:text-yellow-400`}
          />
        );
      default:
        return <Info className={`${iconClass} text-foreground`} />;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={getVariantStyles()}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="grid gap-1 flex-1">
          <div className="text-sm font-semibold">{title}</div>
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {action && (
          <button
            type="button"
            onClick={handleActionClick}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {action.label}
          </button>
        )}

        <button
          type="button"
          onClick={handleClose}
          className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Toast Container Component
export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastProps[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onRemove} />
      ))}
    </div>
  );
}
