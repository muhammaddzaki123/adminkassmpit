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
    <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-white/95 backdrop-blur-xl border-b border-neutral-200 z-40 shadow-soft">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-neutral-700" />
        </button>

        <div className="hidden md:flex items-center flex-1 max-w-lg">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 leading-tight">
            <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Panel Administrasi</p>
            <p className="text-sm font-semibold text-neutral-800">SMP IT ANAK SOLEH MATARAM</p>
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
              <p className="text-xs text-neutral-600">Administrator Sistem</p>
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

