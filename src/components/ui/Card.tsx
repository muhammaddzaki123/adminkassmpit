import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function Card({ children, className, padding = 'lg', onClick }: CardProps) {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-[#e5e7eb] transition-all duration-200 hover:shadow-md",
        paddings[padding],
        onClick && "cursor-pointer hover:border-[#7ec242]",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'primary' | 'warning' | 'danger' | 'info';
}

export function StatCard({ title, value, icon, trend, trendUp, color = 'primary' }: StatCardProps) {
  const colors = {
    primary: "bg-[#7ec242]/10 text-[#7ec242]",
    warning: "bg-[#f59e0b]/10 text-[#f59e0b]",
    danger: "bg-[#ef4444]/10 text-[#ef4444]",
    info: "bg-[#3b82f6]/10 text-[#3b82f6]",
  };

  return (
    <Card padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#6b7280] mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-[#1c1c1c]">{value}</h3>
          {trend && (
            <p className={cn(
              "text-xs mt-2 flex items-center gap-1",
              trendUp ? "text-[#10b981]" : "text-[#ef4444]"
            )}>
              <span>{trendUp ? '↑' : '↓'}</span>
              {trend}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", colors[color])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
