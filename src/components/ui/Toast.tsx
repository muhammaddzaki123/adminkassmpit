import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  onClose?: () => void;
}

export function Toast({ type, message, description, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const styles = {
    success: 'bg-primary-50 border-primary-300 text-primary-800',
    error: 'bg-red-50 border-red-300 text-red-800',
    warning: 'bg-accent-50 border-accent-300 text-accent-800',
    info: 'bg-blue-50 border-blue-300 text-blue-800',
  };

  const iconStyles = {
    success: 'text-primary-600',
    error: 'text-red-600',
    warning: 'text-accent-600',
    info: 'text-blue-600',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border-2 shadow-medium animate-slide-down',
        styles[type]
      )}
    >
      <div className={cn('shrink-0 mt-0.5', iconStyles[type])}>
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{message}</p>
        {description && (
          <p className="text-xs mt-1 opacity-90">{description}</p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
