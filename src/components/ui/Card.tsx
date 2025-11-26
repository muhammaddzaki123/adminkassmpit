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
        "bg-white rounded-2xl shadow-soft border border-neutral-200 transition-all duration-300 hover:shadow-medium card-hover",
        paddings[padding],
        onClick && "cursor-pointer hover:border-primary",
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
  color?: 'primary' | 'warning' | 'danger' | 'info' | 'accent';
}

export function StatCard({ title, value, icon, trend, trendUp, color = 'primary' }: StatCardProps) {
  const colors = {
    primary: "bg-primary-100 text-primary-700",
    accent: "bg-accent-100 text-accent-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <Card padding="md" className="hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-neutral-900 mb-2">{value}</h3>
          {trend && (
            <p className={cn(
              "text-xs font-semibold flex items-center gap-1",
              trendUp ? "text-green-600" : "text-red-600"
            )}>
              <span className="text-base">{trendUp ? '↑' : '↓'}</span>
              {trend}
            </p>
          )}
        </div>
        <div className={cn("p-4 rounded-xl shadow-soft", colors[color])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
