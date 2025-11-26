import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    success: "bg-[#d1fae5] text-[#059669] border-[#a7f3d0]",
    warning: "bg-[#fef3c7] text-[#d97706] border-[#fde68a]",
    error: "bg-[#fee2e2] text-[#dc2626] border-[#fecaca]",
    info: "bg-[#dbeafe] text-[#2563eb] border-[#bfdbfe]",
    default: "bg-[#f3f4f6] text-[#4b5563] border-[#e5e7eb]",
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
