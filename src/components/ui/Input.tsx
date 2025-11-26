import React, { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ className, label, error, icon, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#374151] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={cn(
            "w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-2.5 text-sm text-[#1c1c1c] placeholder:text-[#9ca3af]",
            "focus:border-[#7ec242] focus:outline-none focus:ring-1 focus:ring-[#7ec242]",
            "disabled:cursor-not-allowed disabled:bg-[#f3f4f6] disabled:text-[#6b7280]",
            error && "border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]",
            icon && "pl-10",
            className
          )}
          {...props}
        />
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
            {icon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-[#ef4444]">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function Select({ className, label, options, error, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#374151] mb-1.5">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-2.5 text-sm text-[#1c1c1c]",
          "focus:border-[#7ec242] focus:outline-none focus:ring-1 focus:ring-[#7ec242]",
          "disabled:cursor-not-allowed disabled:bg-[#f3f4f6]",
          error && "border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-[#ef4444]">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ className, label, error, ...props }: TextAreaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#374151] mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-2.5 text-sm text-[#1c1c1c] placeholder:text-[#9ca3af]",
          "focus:border-[#7ec242] focus:outline-none focus:ring-1 focus:ring-[#7ec242]",
          "disabled:cursor-not-allowed disabled:bg-[#f3f4f6]",
          error && "border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[#ef4444]">{error}</p>}
    </div>
  );
}
