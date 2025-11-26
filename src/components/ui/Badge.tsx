import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default' | 'primary' | 'accent';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    success: "bg-primary-100 text-primary-700 border-primary-300",
    primary: "bg-primary-100 text-primary-700 border-primary-300",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-300",
    error: "bg-red-100 text-red-700 border-red-300",
    info: "bg-blue-100 text-blue-700 border-blue-300",
    default: "bg-neutral-100 text-neutral-700 border-neutral-300",
    accent: "bg-accent-100 text-accent-700 border-accent-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
