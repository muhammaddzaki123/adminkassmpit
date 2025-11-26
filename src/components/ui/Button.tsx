import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed btn-shimmer active:scale-95";

  const variants = {
    primary: "bg-primary text-white hover:bg-primary-700 focus:ring-primary-500 shadow-soft hover:shadow-medium",
    secondary: "bg-neutral-50 text-neutral-800 border-2 border-neutral-200 hover:bg-neutral-100 focus:ring-neutral-300 shadow-soft",
    outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary-500",
    ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 focus:ring-neutral-300",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-soft hover:shadow-medium",
    accent: "bg-accent text-white hover:bg-accent-600 focus:ring-accent-500 shadow-soft hover:shadow-medium",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
