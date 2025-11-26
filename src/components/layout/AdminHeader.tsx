'use client';

import { useEffect, useState } from 'react';
import { Menu, Bell, User } from 'lucide-react';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.nama || 'Admin');
    }
  }, []);

  return (
    <header className="h-16 bg-white border-b border-neutral-200 fixed top-0 left-64 right-0 z-40 shadow-soft">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-neutral-700" />
        </button>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Cari user, role, atau menu..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-neutral-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-neutral-900">{userName}</p>
              <p className="text-xs text-neutral-600">Administrator</p>
            </div>
            <div className="w-10 h-10 bg-linear-to-br from-primary to-primary-700 rounded-full flex items-center justify-center shadow-soft">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
