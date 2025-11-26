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
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#7ec242] text-white hover:bg-[#6da83a] focus:ring-[#7ec242] shadow-sm hover:shadow-md",
    secondary: "bg-white text-[#1c1c1c] border border-[#e5e7eb] hover:bg-[#f9fafb] focus:ring-[#e5e7eb]",
    outline: "bg-transparent border-2 border-[#7ec242] text-[#7ec242] hover:bg-[#7ec242]/10 focus:ring-[#7ec242]",
    ghost: "bg-transparent text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#1c1c1c] focus:ring-[#e5e7eb]",
    danger: "bg-[#ef4444] text-white hover:bg-[#dc2626] focus:ring-[#ef4444]",
    accent: "bg-[#1c1c1c] text-white hover:bg-[#374151] focus:ring-[#1c1c1c]",
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
